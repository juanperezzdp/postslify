export type Testimonial = {
  id: string;
  userId?: string;
  name: string;
  image?: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  createdAt: string;
};

export type TestimonialCreateRequest = {
  content: string;
  rating?: number;
};

export type TestimonialModalFormValues = {
  content: string;
  rating: number;
};

export type TestimonialListResponse = {
  items: Testimonial[];
};

export type TestimonialCreateResponse = {
  item: Testimonial;
};
