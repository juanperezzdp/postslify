import mongoose, { Schema, Model } from "mongoose";

export interface ITestimonial {
  user_id: string;
  name: string;
  image?: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial ||
  mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export default Testimonial;
