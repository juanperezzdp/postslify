export type BlogLocale = "en" | "es";

export type BlogPostTranslation = {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  readTime: string;
  tags: string[];
};

export type BlogPost = {
  slug: string;
  date: string;
  imageUrl?: string;
  translations: Record<BlogLocale, BlogPostTranslation>;
};
