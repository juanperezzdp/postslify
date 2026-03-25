import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { StaticImageData } from "next/image";

export interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon?: IconDefinition | React.ComponentType<Record<string, unknown>>;
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: IconDefinition;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface PostCardProps {
  authorName: string;
  authorRole: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
  reposts: number;
  views?: number;
  isOptimized: boolean;
  avatarUrl?: string; 
  postImageUrl?: string | StaticImageData;
}
