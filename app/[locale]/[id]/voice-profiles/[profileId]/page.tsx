"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { VoiceProfileDetail } from "@/types/voice-profile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faPen, 
  faTrash, 
  faFileLines, 
  faMessage, 
  faTimes, 
  faPlus, 
  faExclamationCircle,
  faExclamationTriangle,
  faSpinner,
  faQuoteLeft,
  faLanguage,
  faClock
} from "@fortawesome/free-solid-svg-icons";
import { useLocale, useTranslations } from "next-intl";

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

export default function PerfilDetallePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("VoiceProfileDetail");
  const locale = useLocale();
  
  
  const { profileId } = params;
  const [profile, setProfile] = useState<VoiceProfileDetail | null>(null);
  
  


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [isEditing, setIsEditing] = useState(false);
  const [editContext, setEditContext] = useState("");
  const [editExamples, setEditExamples] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/voice-profiles/${profileId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(t("errors.load"));
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setEditContext(data.context || "");
        setEditExamples(data.examples || []);
      })
      .catch((err) => {
        console.error(err);
        setError(t("errors.loadDescription"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [profileId, t]);

  const getProfileEmoji = (styleTag?: string) => {
    if (!styleTag) return "🎤";
    return styleEmojis[styleTag] || "🎤";
  };

  const localeTag = locale === "es" ? "es-ES" : "en-US";

  const getLanguageLabel = (language?: string) => {
    if (!language) return null;
    try {
      const formatter = new Intl.DisplayNames([localeTag], { type: "language" });
      return formatter.of(language) || language;
    } catch {
      return language;
    }
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(localeTag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimezone = (tz?: string) => {
    if (!tz) return null;
    return tz.split("/").pop()?.replace(/_/g, " ") || tz;
  };

  const handleExampleChange = (index: number, value: string) => {
    if (value.length <= 1250) {
      const newExamples = [...editExamples];
      newExamples[index] = value;
      setEditExamples(newExamples);
    }
  };

  const addExample = () => {
    if (editExamples.length < 3) {
      setEditExamples([...editExamples, ""]);
    }
  };

  const removeExample = (index: number) => {
    const newExamples = editExamples.filter((_, i) => i !== index);
    setEditExamples(newExamples);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanExamples = editExamples.filter((ex) => ex.trim() !== "");

      const res = await fetch(`/api/voice-profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: editContext,
          examples: cleanExamples,
        }),
      });

      if (!res.ok) throw new Error(t("errors.update"));

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setEditContext(updatedProfile.context || "");
      setEditExamples(updatedProfile.examples || []);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert(t("errors.save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/voice-profiles/${profileId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(t("errors.delete"));

      const userId = params.id;
      router.push(`/${userId}/voice-profiles`);

    } catch (err) {
      console.error(err);
      alert(t("errors.deleteProfile"));
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50">
          <FontAwesomeIcon icon={faExclamationCircle} className="h-10 w-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {error || t("notFound.title")}
          </h1>
          <p className="text-slate-500">
            {t("notFound.subtitle")}
          </p>
        </div>
        <Link
          href={`/${params.id}/voice-profiles`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
        >
          {t("notFound.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${params.id}/voice-profiles`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
            {t("back")}
          </Link>
        </div>

        {/* Content */}
        <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Main Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="group flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-gradient-to-br from-white via-white to-blue-50/50 p-8 shadow-xl shadow-slate-200/40 transition-all hover:shadow-2xl hover:shadow-blue-200/20 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-blue-300 text-5xl shadow-lg shadow-blue-100 ring-4 ring-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                {getProfileEmoji(profile.style_tag)}
              </div>
              <div className="flex flex-col gap-3 py-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {profile.voice_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  {profile.style_tag && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-200">
                      {profile.style_tag}
                    </span>
                  )}
                  <span className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("createdOn", { date: formatCreatedDate(profile.created_at) })}
                  </span>
                </div>
              </div>
            </div>

            {/* Contexto */}
            <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
                </div>
              {t("context.title")}
              </h2>
              
              {isEditing ? (
                <textarea
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  className="min-h-[150px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder={t("context.placeholder")}
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                {profile.context || t("context.empty")}
                </p>
              )}
            </div>

            {/* Ejemplos */}
            <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
              <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FontAwesomeIcon icon={faMessage} className="h-4 w-4" />
                </div>
              {t("examples.title")}
              </h2>
              
              {isEditing ? (
                <div className="flex flex-col gap-4">
                  {editExamples.map((example, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-11 w-8 shrink-0 items-center justify-center font-bold text-slate-400">
                        #{index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={example}
                          onChange={(e) => handleExampleChange(index, e.target.value)}
                          className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder={t("examples.placeholder")}
                        />
                        <div className="text-right text-xs font-bold text-slate-400">
                          {example.length}/1250
                        </div>
                      </div>
                      <button
                        onClick={() => removeExample(index)}
                        className="flex cursor-pointer h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addExample}
                    disabled={editExamples.length >= 3}
                    className={`flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 text-sm font-bold transition-all ${
                      editExamples.length >= 3
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                        : "border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {editExamples.length >= 3 ? (
                      t("examples.maxReached")
                    ) : (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                          <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                        </div>
                        {t("examples.add")}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {profile.examples && profile.examples.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {profile.examples.map((example, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                          <div className="absolute -right-4 -top-4 text-9xl text-slate-50 opacity-50 transition-transform duration-500 group-hover:scale-110 group-hover:text-blue-50">
                            <FontAwesomeIcon icon={faQuoteLeft} />
                          </div>
                          <div className="relative z-10">
                            <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
                              #{index + 1}
                            </span>
                            <p className="text-lg leading-relaxed text-slate-700 font-medium">
                              &quot;{example}&quot;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-400 italic">
                      {t("examples.empty")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("details.title")}
              </h3>
              <div className="flex flex-col gap-4">
                <div className="group flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-blue-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 group-hover:text-blue-500">{t("details.styleLabel")}</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {profile.style_tag || t("details.unspecified")}
                    </span>
                  </div>
                  <div className="text-2xl opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all">
                    {getProfileEmoji(profile.style_tag)}
                  </div>
                </div>

                <div className="group flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-blue-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 group-hover:text-blue-500">{t("details.languageLabel")}</span>
                    <span className="text-sm font-bold text-slate-900 capitalize">
                      {getLanguageLabel(profile.language) || t("details.unspecified")}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 group-hover:text-blue-500 group-hover:ring-blue-200 transition-all">
                    <FontAwesomeIcon icon={faLanguage} className="h-4 w-4" />
                  </div>
                </div>

                <div className="group flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-blue-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 group-hover:text-blue-500">{t("details.timezoneLabel")}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatTimezone(profile.timezone) || t("details.unspecified")}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 group-hover:text-blue-500 group-hover:ring-blue-200 transition-all">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                  </div>
                </div>
                
                {!isEditing ? (
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                      {t("actions.edit")}
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 bg-red-50 px-4 py-4 text-sm font-bold text-red-600 transition-all hover:border-red-200 hover:bg-red-100 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      {t("actions.delete")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isSaving ? (
                        <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                      ) : (
                        t("actions.saveChanges")
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                      {t("actions.cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                {t("delete.title")}
              </h3>
              <p className="text-slate-500">
                {t.rich("delete.description", {
                  profileName: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                  name: profile.voice_name,
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-8 py-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 cursor-pointer  rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl hover:shadow-red-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                    <span>{t("actions.deleting")}</span>
                  </>
                ) : (
                  t("actions.delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
