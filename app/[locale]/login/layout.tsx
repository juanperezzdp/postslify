import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = locale === "es" ? "es" : "en";

  return {
    title: "Login | Postslify - Social Media Management",
    description:
      "Access your Postslify dashboard to schedule posts, track analytics, and manage your social media presence. Sign in or create an account to get started.",
    alternates: {
      canonical: `/${safeLocale}/login`,
      languages: {
        en: "/en/login",
        es: "/es/login",
        "x-default": "/en/login",
      },
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: "Login | Postslify",
      description:
        "Unlock the full power of your social media. Manage, schedule, and analyze with Postslify.",
      type: "website",
      url: `/${safeLocale}/login`,
    },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
