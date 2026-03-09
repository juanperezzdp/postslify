import type { Message } from "@/types/posts";

export type ChatHistoryVoiceProfile = {
  id?: string;
  name?: string;
  style_tag?: string;
  style_emoji?: string;
  language?: string;
  context?: string;
  examples?: string[];
};

export type ChatHistoryRecord = {
  user_id: string;
  session_id?: string;
  user_message: string;
  ai_response: string;
  voice_profile?: ChatHistoryVoiceProfile;
  media?: Message["media"];
  archived?: boolean;
  createdAt: Date;
  expiresAt: Date;
};

export type ChatHistoryListItem = {
  id: string;
  user_message: string;
  ai_response: string;
  voice_profile?: ChatHistoryVoiceProfile;
  media?: Message["media"];
  createdAt: string;
};

export type ChatHistoryListResponse = {
  items: ChatHistoryListItem[];
  hasMore: boolean;
  nextCursor?: string;
};

export type ArchivedPostItem = ChatHistoryListItem & {
  media?: Message["media"];
};

export type ChatHistoryUpdateRequest = {
  id: string;
  media?: Message["media"] | null;
  ai_response?: string;
};
