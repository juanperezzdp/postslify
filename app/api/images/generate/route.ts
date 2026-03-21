import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { ImageGenerationRequest, ImageGenerationResponse } from "@/types/image-generation";

const COST_PER_IMAGE = 8;
const MAX_IMAGE_REQUESTS_PER_MINUTE_PER_USER = 10;
const MAX_IMAGE_REQUESTS_PER_MINUTE_GLOBAL = 500;
const REQUEST_WINDOW_MS = 60_000;
const GLOBAL_BUCKET_KEY = "global";

const requestBuckets = new Map<
  string,
  {
    count: number;
    windowStart: number;
  }
>();

const imageQueue: {
  task: () => Promise<ImageGenerationResponse>;
  resolve: (value: ImageGenerationResponse) => void;
  reject: (reason: unknown) => void;
}[] = [];
let isProcessingImageQueue = false;

const processImageQueue = async () => {
  if (isProcessingImageQueue) return;
  isProcessingImageQueue = true;
  while (imageQueue.length > 0) {
    const nextItem = imageQueue.shift();
    if (!nextItem) continue;
    try {
      const result = await nextItem.task();
      nextItem.resolve(result);
    } catch (error) {
      nextItem.reject(error);
    }
  }
  isProcessingImageQueue = false;
};

const enqueueImageGeneration = (task: () => Promise<ImageGenerationResponse>) =>
  new Promise<ImageGenerationResponse>((resolve, reject) => {
    imageQueue.push({ task, resolve, reject });
    void processImageQueue();
  });

export async function POST(req: Request) {
  let charged = false;
  let resolvedUserId: string | null = null;
  let refunded = false;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not found. Please add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    await dbConnect();

    const body = (await req.json().catch(() => null)) as ImageGenerationRequest | null;
    const prompt = body?.prompt?.trim();
    const allowedSizes = ["1024x1024", "1024x1536", "1536x1024"] as const;
    const allowedQualities = ["low", "medium", "high", "auto"] as const;
    const requestedSize = body?.size;
    const requestedQuality = body?.quality;
    const size = requestedSize && allowedSizes.includes(requestedSize) ? requestedSize : "1024x1024";
    const quality =
      requestedQuality && allowedQualities.includes(requestedQuality) ? requestedQuality : "low";

    if (!prompt) {
      return NextResponse.json({ error: "El prompt es obligatorio" }, { status: 400 });
    }

    resolvedUserId = session.user.id;
    const now = Date.now();
    const globalBucket = requestBuckets.get(GLOBAL_BUCKET_KEY);
    if (!globalBucket || now - globalBucket.windowStart >= REQUEST_WINDOW_MS) {
      requestBuckets.set(GLOBAL_BUCKET_KEY, { count: 1, windowStart: now });
    } else if (globalBucket.count >= MAX_IMAGE_REQUESTS_PER_MINUTE_GLOBAL) {
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
    } else if (currentBucket.count >= MAX_IMAGE_REQUESTS_PER_MINUTE_PER_USER) {
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
      { _id: resolvedUserId, credits_balance_cents: { $gte: COST_PER_IMAGE } },
      { $inc: { credits_balance_cents: -COST_PER_IMAGE } },
      { returnDocument: "after" }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Créditos insuficientes para generar la imagen.", details: "Insufficient credits" },
        { status: 402 }
      );
    }
    charged = true;

    const payload = await enqueueImageGeneration(async () => {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1-mini",
          prompt,
          size,
          quality,
        }),
      });

      const data = (await response.json()) as {
        data?: { b64_json?: string }[];
        error?: { message?: string };
      };

      if (!response.ok) {
        await User.findByIdAndUpdate(resolvedUserId, {
          $inc: { credits_balance_cents: COST_PER_IMAGE }
        });
        refunded = true;
        throw new Error(data.error?.message || "Error communicating with OpenAI API");
      }

      const base64 = data.data?.[0]?.b64_json;
      if (!base64) {
        await User.findByIdAndUpdate(resolvedUserId, {
          $inc: { credits_balance_cents: COST_PER_IMAGE }
        });
        refunded = true;
        throw new Error("No se pudo generar la imagen");
      }

      const imageUrl = `data:image/png;base64,${base64}`;
      return { imageUrl, prompt };
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error generating image:", error);
    if (charged && resolvedUserId && !refunded) {
      await User.findByIdAndUpdate(resolvedUserId, {
        $inc: { credits_balance_cents: COST_PER_IMAGE }
      });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
