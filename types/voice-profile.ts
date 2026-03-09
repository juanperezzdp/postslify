export type VoiceProfile = {
  id: string;
  voice_name: string;
  style_tag: string;
  style_emoji?: string;
  context?: string;
  examples?: string[];
  timezone?: string;
  language?: string;
};

export type VoiceProfileSnapshot = {
  name: string;
  style: string;
  language?: string;
  emoji?: string;
};

export type VoiceProfileSummary = {
  id: string;
  voice_name: string;
  style_tag?: string;
  created_at: string;
  language?: string;
  timezone?: string;
};

export type VoiceProfileDetail = {
  id: string;
  voice_name: string;
  style_tag?: string;
  context?: string;
  examples?: string[];
  created_at: string;
  language?: string;
  timezone?: string;
};

export type VoiceProfilePayload = {
  voiceName?: string;
  timezone?: string;
  context?: string;
  examples?: string[];
  selectedTag?: string;
  styleEmoji?: string;
  language?: string;
};

export type VoiceTag = {
  id: string;
  label: string;
  emoji: string;
};

export type TimezoneOption = {
  value: string;
  label: string;
};

export type VoiceProfileFormValues = {
  voiceName: string;
  timezone: string;
  language: string;
  context: string;
  selectedTag: string;
  examples: { value: string }[];
};
