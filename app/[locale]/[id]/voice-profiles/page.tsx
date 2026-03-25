"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { VoiceProfileSummary } from "@/types/voice-profile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faArrowRight, faClock, faLanguage } from "@fortawesome/free-solid-svg-icons";
import { useTranslations, useLocale } from "next-intl";

const styleEmojis: Record<string, string> = {
  formal: "🎩",
  informal: "✌️",
  humor: "😂",
  motivacional: "💪",
  educativo: "📚",
  inspirador: "🌟",
  corporativo: "🏢",
  tecnico: "🛠️",
  storytelling: "📖",
  directo: "⚡",
   autoridad: "👑",
   empatico: "🤝",
   creativo: "🎨",
   analitico: "📊",
   polemico: "🔥",
   reflexivo: "🧠",
   visionario: "🚀",
   minimalista: "✨",
   comunidad: "🧑‍🤝‍🧑",
   emocional: "💖",
};

export default function PerfilesPage() {
  const params = useParams();
  const userId = params.id as string;
  const [profiles, setProfiles] = useState<VoiceProfileSummary[]>([]);
  const t = useTranslations('VoiceProfiles');
  const tTags = useTranslations('VoiceProfileTags');
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/voice-profiles")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al cargar los perfiles");
        }
        return res.json();
      })
      .then((data) => {
        setProfiles(data);
      })
      .catch((err) => {
        console.error(err);
        setError(t('error'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  const getProfileEmoji = (styleTag?: string) => {
    if (!styleTag) return "🎤";
    return styleEmojis[styleTag] || "🎤";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLanguageLabel = (language?: string) => {
    if (!language) return null;
    try {
      const formatter = new Intl.DisplayNames([locale], { type: "language" });
      return formatter.of(language) || language;
    } catch {
      return language;
    }
  };

  const formatTimezone = (tz?: string) => {
    if (!tz) return null;
    return tz.split("/").pop()?.replace(/_/g, " ") || tz;
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-lg shadow-zinc-200 mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {t('title')}
            </h1>
            <p className="text-sm font-medium text-zinc-500 max-w-xl">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href={`/${userId}/voice-profile`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            <FontAwesomeIcon icon={faMicrophone} className="h-4 w-4" />
            <span>{t('createProfile')}</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl border border-zinc-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 font-medium">
            {error}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-white/50 py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 ring-8 ring-zinc-50">
              <FontAwesomeIcon icon={faMicrophone} className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-zinc-900">
              {t('noProfiles.title')}
            </h3>
            <p className="mb-8 max-w-md text-zinc-500">
              {t('noProfiles.description')}
            </p>
            <Link
              href={`/${userId}/voice-profile`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 text-sm font-bold text-white shadow-lg shadow-zinc-200 transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95"
            >
              {t('noProfiles.cta')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Link
                href={`/${userId}/voice-profiles/${profile.id}`}
                key={profile.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/40 transition-all hover:-tranzinc-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-200/40"
              >
                <div>
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                      {getProfileEmoji(profile.style_tag)}
                    </div>
                    {profile.style_tag && (
                      <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 ring-1 ring-blue-100">
                        {tTags(profile.style_tag)}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {profile.voice_name}
                  </h3>
                  
                  <div className="flex flex-col gap-1.5 mt-3">
                    {profile.language && (
                      <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <FontAwesomeIcon icon={faLanguage} className="h-3.5 w-3.5 text-zinc-400" />
                        {getLanguageLabel(profile.language)}
                      </p>
                    )}
                    {profile.timezone && (
                      <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-zinc-400" />
                        {formatTimezone(profile.timezone)}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-medium text-zinc-400 border-t border-zinc-50 pt-3">
                    {t('card.createdOn', { date: formatDate(profile.created_at) })}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
                   <span className="text-sm font-bold text-zinc-400 group-hover:text-blue-600 transition-colors">
                     {t('card.viewDetails')}
                   </span>
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-300 transition-all group-hover:bg-blue-100 group-hover:text-blue-600">
                     <FontAwesomeIcon 
                       icon={faArrowRight} 
                       className="h-3 w-3" 
                     />
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
