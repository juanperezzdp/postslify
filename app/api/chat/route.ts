import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ChatHistory from "@/models/ChatHistory";
import type { Message } from "@/types/posts";
import type { VoiceProfile } from "@/types/voice-profile";

const MAX_REQUESTS_PER_MINUTE_PER_USER = 50;
const MAX_REQUESTS_PER_MINUTE_GLOBAL = 500;
const REQUEST_WINDOW_MS = 60_000;
const COST_PER_MESSAGE = 3; 
const GLOBAL_BUCKET_KEY = "global";

const requestBuckets = new Map<
  string,
  {
    count: number;
    windowStart: number;
  }
>();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { messages, voiceProfile, prompt, sessionId } = (await req.json()) as {
      messages?: Message[];
      voiceProfile?: VoiceProfile;
      prompt?: string;
      sessionId?: string;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not found. Please add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    await dbConnect();

    let systemContent =
      "You are an expert assistant in writing LinkedIn content (Postslify). You help users create viral, engaging, and professional posts. Your tone is helpful, creative, and professional. Use emojis appropriately. STRICT RULE: NEVER use bold markdown (**) in the post content, deliver plain text. STRICT RULE: ALWAYS generate a LinkedIn post related to the user's topic, even if the message is a greeting or very short. Do not greet or respond to conversation, only deliver the post.";

    if (voiceProfile) {
      systemContent += `\n\nIMPORTANT: You must adopt the following voice profile for your responses:
      
Profile name: ${voiceProfile.voice_name}
Context/Role: ${voiceProfile.context || 'Not specified'}
Style tag: ${voiceProfile.style_tag || 'Not specified'}
${voiceProfile.language ? `\nMANDATORY LANGUAGE: The generated content MUST be STRICTLY in ${voiceProfile.language.toUpperCase()}. If the user writes in another language, you MUST respond and generate the post in ${voiceProfile.language.toUpperCase()}.` : ''}

Below are example posts written in this style. You must analyze the tone, structure, and vocabulary from these examples and emulate them in your responses:

Examples:
${Array.isArray(voiceProfile.examples) ? voiceProfile.examples.join('\n\n') : (voiceProfile.examples || 'No examples available.')}

Make sure your responses sound as if they were written by this person, preserving their unique style.`;
    }

    const resolvedUserId = session.user.id;

    const now = Date.now();
    const globalBucket = requestBuckets.get(GLOBAL_BUCKET_KEY);
    if (!globalBucket || now - globalBucket.windowStart >= REQUEST_WINDOW_MS) {
      requestBuckets.set(GLOBAL_BUCKET_KEY, { count: 1, windowStart: now });
    } else if (globalBucket.count >= MAX_REQUESTS_PER_MINUTE_GLOBAL) {
      return NextResponse.json(
        { error: "Límite temporal alcanzado" },
        { status: 429 }
      );
    } else {
      requestBuckets.set(GLOBAL_BUCKET_KEY, {
        count: globalBucket.count + 1,
        windowStart: globalBucket.windowStart,
      });
    }

    const currentBucket = requestBuckets.get(resolvedUserId);
    if (!currentBucket || now - currentBucket.windowStart >= REQUEST_WINDOW_MS) {
      requestBuckets.set(resolvedUserId, { count: 1, windowStart: now });
    } else if (currentBucket.count >= MAX_REQUESTS_PER_MINUTE_PER_USER) {
      return NextResponse.json(
        { error: "Límite temporal alcanzado" },
        { status: 429 }
      );
    } else {
      requestBuckets.set(resolvedUserId, {
        count: currentBucket.count + 1,
        windowStart: currentBucket.windowStart,
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: resolvedUserId, credits_balance_cents: { $gte: COST_PER_MESSAGE } },
      { $inc: { credits_balance_cents: -COST_PER_MESSAGE } },
      { returnDocument: "after" }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Créditos insuficientes para realizar esta acción.", details: "Insufficient credits" },
        { status: 402 } 
      );
    }

    const isValidMessage = (value: unknown): value is Message => {
      if (!value || typeof value !== "object") return false;
      const record = value as { role?: unknown; content?: unknown };
      const validRole = record.role === "user" || record.role === "assistant";
      return validRole && typeof record.content === "string";
    };

    const normalizeUserPrompt = (content: string) => {
      const topic = content.trim() || "topic";
      return `Topic: ${topic}. Generate a LinkedIn post related to the topic. Do not greet or reply to conversation. Output only the post text.`;
    };

    const resolvedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const baseMessages = Array.isArray(messages) ? messages : [];
    const preparedMessages: Message[] = baseMessages
      .filter(isValidMessage)
      .map((message) =>
        message.role === "user"
          ? { role: "user", content: normalizeUserPrompt(message.content) }
          : { role: "assistant", content: message.content },
      );
    const rawLastUserMessage =
      [...baseMessages].reverse().find((message) => message.role === "user")?.content?.trim() ||
      "";
    const userMessageForHistory = resolvedPrompt || rawLastUserMessage || "tema";
    const fallbackUserMessage =
      [...preparedMessages].reverse().find((message) => message.role === "user") ||
      ({ role: "user", content: normalizeUserPrompt("") } as Message);
    const lastUserMessage = resolvedPrompt
      ? { role: "user", content: normalizeUserPrompt(resolvedPrompt) }
      : fallbackUserMessage;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          lastUserMessage,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      await User.findByIdAndUpdate(resolvedUserId, {
        $inc: { credits_balance_cents: COST_PER_MESSAGE }
      });

      const error = await response.json();
      console.error("OpenAI API Error:", error);
      return NextResponse.json(
        { error: error.message || "Error communicating with OpenAI API" },
        { status: response.status }
      );
    }

    const voiceProfileSnapshot = voiceProfile
      ? {
          id: voiceProfile.id,
          name: voiceProfile.voice_name,
          style_tag: voiceProfile.style_tag,
          style_emoji: voiceProfile.style_emoji,
          language: voiceProfile.language,
          context: voiceProfile.context,
          examples: voiceProfile.examples,
        }
      : undefined;

    let historyEntryId: string | null = null;
    try {
      const historyEntry = await ChatHistory.create({
        user_id: resolvedUserId,
        session_id: typeof sessionId === "string" ? sessionId : undefined,
        user_message: userMessageForHistory,
        ai_response: " ",
        voice_profile: voiceProfileSnapshot,
      });
      historyEntryId = historyEntry._id.toString();
    } catch (historyError) {
      console.error("Error creating chat history entry:", historyError);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let assistantMessage = "";
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine.startsWith("data: ")) continue;
              const data = trimmedLine.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const content = parsed.choices?.[0]?.delta?.content;
                if (typeof content === "string" && content) {
                  assistantMessage += content;
                }
              } catch (parseError) {
                console.error("Error parsing AI stream chunk:", parseError);
              }
            }
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          if (assistantMessage.trim()) {
            try {
              if (historyEntryId) {
                await ChatHistory.findByIdAndUpdate(historyEntryId, {
                  $set: {
                    ai_response: assistantMessage,
                    voice_profile: voiceProfileSnapshot,
                  },
                });
              } else {
                await ChatHistory.create({
                  user_id: resolvedUserId,
                  session_id: typeof sessionId === "string" ? sessionId : undefined,
                  user_message: userMessageForHistory,
                  ai_response: assistantMessage,
                  voice_profile: voiceProfileSnapshot,
                });
              }
            } catch (historyError) {
              console.error("Error saving chat history:", historyError);
            }
          }
        } catch (streamError) {
          console.error("Stream error:", streamError);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    };
    if (historyEntryId) {
      responseHeaders["X-Chat-History-Id"] = historyEntryId;
    }

    return new NextResponse(stream, {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
