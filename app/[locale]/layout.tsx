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

export const metadata: Metadata = {
  title: "Postslify",
  description: "Publica en LinkedIn fácilmente",
};

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
