import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Postslify - Social Media Management",
  description: "Recover your Postslify account password.",
  openGraph: {
    title: "Forgot Password | Postslify",
    description: "Recover your Postslify account password.",
    type: "website",
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
