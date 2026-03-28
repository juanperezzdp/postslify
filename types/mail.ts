export type WelcomeEmailLocale = "en" | "es";

export interface WelcomeEmailContent {
  preheader: string;
  subject: string;
  heading: string;
  intro: string;
  ctaText: string;
  appreciation: string;
  supportLine: string;
  contactLabel: string;
  contactEmail: string;
  legal: string;
}
