import mongoose, { Schema, Model } from "mongoose";
import type { ChatHistoryRecord } from "@/types/chat-history";

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const ChatHistorySchema = new Schema<ChatHistoryRecord>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    session_id: {
      type: String,
      index: true,
    },
    user_message: {
      type: String,
      required: true,
    },
    ai_response: {
      type: String,
      required: false,
      default: "",
    },
    voice_profile: {
      id: String,
      name: String,
      style_tag: String,
      style_emoji: String,
      language: String,
      context: String,
      examples: [String],
    },
    media: {
      type: {
        type: String,
        enum: ["image", "video", "document"],
      },
      url: String,
      name: String,
      items: [
        {
          url: String,
          name: String,
        },
      ],
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + SEVEN_DAYS_IN_MS),
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.ChatHistory) {
  delete mongoose.models.ChatHistory;
}

const ChatHistory: Model<ChatHistoryRecord> = mongoose.model<ChatHistoryRecord>(
  "ChatHistory",
  ChatHistorySchema
);

export default ChatHistory;
