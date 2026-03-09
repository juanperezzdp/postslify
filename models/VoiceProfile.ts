import mongoose, { Schema, Model } from "mongoose";

export interface IExample {
  content: string;
}

export interface IVoiceProfile {
  user_id: string; 
  voice_name: string;
  timezone: string;
  language: string;
  context: string;
  examples: string[];
  selected_tag: string;
  style_emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceProfileSchema = new Schema<IVoiceProfile>(
  {
    user_id: {
      type: String, 
      required: true,
      index: true,
    },
    voice_name: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    context: {
      type: String,
      required: true,
    },
    examples: {
      type: [String],
      default: [],
    },
    selected_tag: {
      type: String,
      required: true,
    },
    style_emoji: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const VoiceProfile: Model<IVoiceProfile> =
  mongoose.models.VoiceProfile ||
  mongoose.model<IVoiceProfile>("VoiceProfile", VoiceProfileSchema);

export default VoiceProfile;
