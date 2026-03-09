import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Postslify - Social Media Management",
  description: "Access your Postslify dashboard to schedule posts, track analytics, and manage your social media presence. Sign in or create an account to get started.",
  openGraph: {
    title: "Login | Postslify",
    description: "Unlock the full power of your social media. Manage, schedule, and analyze with Postslify.",
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
