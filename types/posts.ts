export type Message = {
  role: "user" | "assistant";
  content: string;
  historyId?: string;
  media?: {
    type: "image" | "video" | "document";
    url: string;
    name: string;
    items?: { url: string; name: string }[];
  };
  voiceProfileName?: string;
  voiceProfileStyleTag?: string;
  voiceProfileEmoji?: string;
  voiceProfileLanguage?: string;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
};

export type ScheduledPost = {
  id: string;
  content: string;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  published_at?: string;
  failed_at?: string;
  media_type?: string;
  media_name?: string;
  media_base64?: string;
  timezone?: string;
  voice_profile_emoji?: string;
  voice_profile_name?: string;
  voice_profile_style?: string;
  linkedin_target?: "profile" | "page";
  linkedin_page_urn?: string;
  linkedin_target_name?: string | null;
  linkedin_target_image?: string | null;
};

export type PublishTargets = {
  linkedinProfile: boolean;
  linkedinPage: boolean;
};

export type ScheduleFormValues = {
  scheduledDate: string;
  timezone: string;
  scheduleProfile: boolean;
  schedulePageUrns: string[];
};
