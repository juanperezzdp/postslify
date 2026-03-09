import mongoose, { Schema, Model } from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  name?: string;
  image?: string;
  testimonial_done?: boolean;
  password_hash?: string;
  credits_balance_cents: number;
  linkedin_name?: string;
  linkedin_headline?: string;
  linkedin_picture?: string;
  linkedin_access_token?: string;
  linkedin_member_urn?: string;
  linkedin_expires_at?: number;
  linkedin_refresh_token?: string;
  linkedin_refresh_expires_at?: number;
  linkedin_page_access_token_encrypted?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    testimonial_done: {
      type: Boolean,
      default: false,
    },
    password_hash: {
      type: String,
      select: false, 
    },
    credits_balance_cents: {
      type: Number,
      default: 0,
    },
    linkedin_name: {
      type: String,
    },
    linkedin_headline: {
      type: String,
    },
    linkedin_picture: {
      type: String,
    },
    linkedin_access_token: {
      type: String,
    },
    linkedin_member_urn: {
      type: String,
    },
    linkedin_expires_at: {
      type: Number,
    },
    linkedin_refresh_token: {
      type: String, 
    },
    linkedin_refresh_expires_at: {
      type: Number,
    },
    linkedin_page_access_token_encrypted: {
      type: String,
    },
    reset_token: {
      type: String,
    },
    reset_token_expires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
