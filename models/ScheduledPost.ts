import mongoose, { Schema, Model } from "mongoose";

export interface IScheduledPost {
  user_id: mongoose.Types.ObjectId;
  content: string;
  scheduled_at: Date;
  timezone: string;
  media_base64?: string;
  media_type?: string;
  media_name?: string;
  voice_profile_name?: string;
  voice_profile_emoji?: string;
  voice_profile_style?: string;
  linkedin_target: string;
  linkedin_page_urn?: string;
  linkedin_target_name?: string | null;
  linkedin_target_image?: string | null;
  status: "pending" | "published" | "failed";
  linkedin_post_id?: string;
  error_message?: string;
  published_at?: Date;
  failed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    media_base64: String,
    media_type: String,
    media_name: String,
    voice_profile_name: String,
    voice_profile_emoji: String,
    voice_profile_style: String,
    linkedin_target: {
      type: String,
      required: true,
    },
    linkedin_page_urn: String,
    linkedin_target_name: String,
    linkedin_target_image: String,
    status: {
      type: String,
      enum: ["pending", "published", "failed"],
      default: "pending",
    },
    linkedin_post_id: String,
    error_message: String,
    published_at: Date,
    failed_at: Date,
  },
  {
    timestamps: true,
  }
);

ScheduledPostSchema.index({ published_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
ScheduledPostSchema.index({ failed_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 12 });

const ScheduledPost: Model<IScheduledPost> =
  mongoose.models.ScheduledPost ||
  mongoose.model<IScheduledPost>("ScheduledPost", ScheduledPostSchema);

export default ScheduledPost;
