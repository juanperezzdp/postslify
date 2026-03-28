import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";
import { ClientLayout } from "../components/ClientLayout";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { auth } from "@/auth";

config.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tanNimbus = localFont({
  src: "../fonts/TAN-NIMBUS.otf",
  variable: "--font-tan",
  display: "swap",
  weight: "400",
});

const siteUrl = "https://www.postslify.com";

const seoContentByLocale = {
  en: {
    title: "Postslify - Transform your LinkedIn presence with AI",
    description:
      "Create, schedule and optimize LinkedIn content with AI. Maintain a consistent presence, scale your personal brand and attract better opportunities.",
    keywords: [
      "LinkedIn AI",
      "LinkedIn content scheduler",
      "AI post generator",
      "personal branding",
      "B2B marketing",
      "social media automation",
    ],
    locale: "en_US",
    alternateLocale: "es_ES",
  },
  es: {
    title: "Postslify - Transforma tu presencia en LinkedIn con IA",
    description:
      "Crea, programa y optimiza contenido para LinkedIn con IA. Mantén presencia constante, escala tu marca personal y atrae mejores oportunidades.",
    keywords: [
      "IA para LinkedIn",
      "programador de contenido LinkedIn",
      "generador de posts con IA",
      "marca personal",
      "marketing B2B",
      "automatización de redes sociales",
    ],
    locale: "es_ES",
    alternateLocale: "en_US",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = locale === "es" ? "es" : "en";
  const seo = seoContentByLocale[safeLocale];

  return {
    metadataBase: new URL(siteUrl),
    title: seo.title,
    description: seo.description,
    keywords: [...seo.keywords],
    alternates: {
      canonical: `/${safeLocale}`,
      languages: {
        en: "/en",
        es: "/es",
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      url: `/${safeLocale}`,
      siteName: "Postslify",
      title: seo.title,
      description: seo.description,
      locale: seo.locale,
      alternateLocale: [seo.alternateLocale],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  
  if (!routing.locales.includes(locale as 'en' | 'es')) {
    notFound();
  }
 
  
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tanNimbus.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ClientLayout session={session}>{children}</ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
