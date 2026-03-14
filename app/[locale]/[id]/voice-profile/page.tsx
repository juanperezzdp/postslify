"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import type { VoiceTag, VoiceProfileFormValues } from "@/types/voice-profile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { Select } from "@/app/components/Select";
import { PREDEFINED_TIMEZONES } from "@/lib/timezone";

const PREDEFINED_LANGUAGES = [
  { value: "af", label: "Afrikaans" },
  { value: "sq", label: "Albanian" },
  { value: "am", label: "Amharic" },
  { value: "ar", label: "Arabic" },
  { value: "hy", label: "Armenian" },
  { value: "az", label: "Azerbaijani" },
  { value: "eu", label: "Basque" },
  { value: "be", label: "Belarusian" },
  { value: "bn", label: "Bengali" },
  { value: "bs", label: "Bosnian" },
  { value: "bg", label: "Bulgarian" },
  { value: "ca", label: "Catalan" },
  { value: "ceb", label: "Cebuano" },
  { value: "ny", label: "Chichewa" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "zh-TW", label: "Chinese (Traditional)" },
  { value: "co", label: "Corsican" },
  { value: "hr", label: "Croatian" },
  { value: "cs", label: "Czech" },
  { value: "da", label: "Danish" },
  { value: "nl", label: "Dutch" },
  { value: "en", label: "English" },
  { value: "eo", label: "Esperanto" },
  { value: "et", label: "Estonian" },
  { value: "tl", label: "Filipino" },
  { value: "fi", label: "Finnish" },
  { value: "fr", label: "French" },
  { value: "fy", label: "Frisian" },
  { value: "gl", label: "Galician" },
  { value: "ka", label: "Georgian" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "gu", label: "Gujarati" },
  { value: "ht", label: "Haitian Creole" },
  { value: "ha", label: "Hausa" },
  { value: "haw", label: "Hawaiian" },
  { value: "iw", label: "Hebrew" },
  { value: "hi", label: "Hindi" },
  { value: "hmn", label: "Hmong" },
  { value: "hu", label: "Hungarian" },
  { value: "is", label: "Icelandic" },
  { value: "ig", label: "Igbo" },
  { value: "id", label: "Indonesian" },
  { value: "ga", label: "Irish" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "jw", label: "Javanese" },
  { value: "kn", label: "Kannada" },
  { value: "kk", label: "Kazakh" },
  { value: "km", label: "Khmer" },
  { value: "ko", label: "Korean" },
  { value: "ku", label: "Kurdish (Kurmanji)" },
  { value: "ky", label: "Kyrgyz" },
  { value: "lo", label: "Lao" },
  { value: "la", label: "Latin" },
  { value: "lv", label: "Latvian" },
  { value: "lt", label: "Lithuanian" },
  { value: "lb", label: "Luxembourgish" },
  { value: "mk", label: "Macedonian" },
  { value: "mg", label: "Malagasy" },
  { value: "ms", label: "Malay" },
  { value: "ml", label: "Malayalam" },
  { value: "mt", label: "Maltese" },
  { value: "mi", label: "Maori" },
  { value: "mr", label: "Marathi" },
  { value: "mn", label: "Mongolian" },
  { value: "my", label: "Myanmar (Burmese)" },
  { value: "ne", label: "Nepali" },
  { value: "no", label: "Norwegian" },
  { value: "ps", label: "Pashto" },
  { value: "fa", label: "Persian" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "pa", label: "Punjabi" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sm", label: "Samoan" },
  { value: "gd", label: "Scots Gaelic" },
  { value: "sr", label: "Serbian" },
  { value: "st", label: "Sesotho" },
  { value: "sn", label: "Shona" },
  { value: "sd", label: "Sindhi" },
  { value: "si", label: "Sinhala" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "so", label: "Somali" },
  { value: "es", label: "Spanish" },
  { value: "su", label: "Sundanese" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Swedish" },
  { value: "tg", label: "Tajik" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "uz", label: "Uzbek" },
  { value: "vi", label: "Vietnamese" },
  { value: "cy", label: "Welsh" },
  { value: "xh", label: "Xhosa" },
  { value: "yi", label: "Yiddish" },
  { value: "yo", label: "Yoruba" },
  { value: "zu", label: "Zulu" }
];

const MAX_PROFILES = 30;

export default function PerfilPage() {
  const t = useTranslations('VoiceProfileForm');
  const tTags = useTranslations('VoiceProfileTags');
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<VoiceProfileFormValues>({
    defaultValues: {
      voiceName: "",
      timezone: "",
      language: "",
      context: "",
      selectedTag: "",
      examples: [{ value: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "examples"
  });

  const selectedTag = watch("selectedTag");
  const examples = watch("examples");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const loadProfileCount = async () => {
      try {
        const response = await fetch("/api/voice-profiles", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as unknown;
        if (Array.isArray(data)) {
          setProfileCount(data.length);
          setIsLimitReached(data.length >= MAX_PROFILES);
        } else {
          setProfileCount(0);
          setIsLimitReached(false);
        }
      } catch {
        return;
      }
    };

    loadProfileCount();
  }, []);

  const tags: VoiceTag[] = [
    { id: "formal", label: tTags("formal"), emoji: "🎩" },
    { id: "informal", label: tTags("informal"), emoji: "✌️" },
    { id: "humor", label: tTags("humor"), emoji: "😂" },
    { id: "motivacional", label: tTags("motivacional"), emoji: "💪" },
    { id: "educativo", label: tTags("educativo"), emoji: "📚" },
    { id: "inspirador", label: tTags("inspirador"), emoji: "🌟" },
    { id: "corporativo", label: tTags("corporativo"), emoji: "🏢" },
    { id: "tecnico", label: tTags("tecnico"), emoji: "🛠️" },
    { id: "storytelling", label: tTags("storytelling"), emoji: "📖" },
    { id: "directo", label: tTags("directo"), emoji: "⚡" },
    { id: "autoridad", label: tTags("autoridad"), emoji: "👑" },
    { id: "empatico", label: tTags("empatico"), emoji: "🤝" },
    { id: "creativo", label: tTags("creativo"), emoji: "🎨" },
    { id: "analitico", label: tTags("analitico"), emoji: "📊" },
    { id: "polemico", label: tTags("polemico"), emoji: "🔥" },
    { id: "reflexivo", label: tTags("reflexivo"), emoji: "🧠" },
    { id: "visionario", label: tTags("visionario"), emoji: "🚀" },
    { id: "minimalista", label: tTags("minimalista"), emoji: "✨" },
    { id: "comunidad", label: tTags("comunidad"), emoji: "🧑‍🤝‍🧑" },
    { id: "emocional", label: tTags("emocional"), emoji: "💖" },
    { id: "diplomatico", label: tTags("diplomatico"), emoji: "🕊️" },
    { id: "periodistico", label: tTags("periodistico"), emoji: "📰" },
    { id: "academico", label: tTags("academico"), emoji: "🎓" },
    { id: "comercial", label: tTags("comercial"), emoji: "💼" },
    { id: "aventurero", label: tTags("aventurero"), emoji: "🧗" },
    { id: "espiritual", label: tTags("espiritual"), emoji: "🧘" },
    { id: "juvenil", label: tTags("juvenil"), emoji: "👾" },
    { id: "disruptivo", label: tTags("disruptivo"), emoji: "💥" },
    { id: "nostalgico", label: tTags("nostalgico"), emoji: "🕰️" },
  ];

  const addExample = () => {
    if (fields.length < 10) {
      append({ value: "" });
    }
  };

  const removeExample = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      
      setValue(`examples.${0}.value`, "");
    }
  };

  const onSubmit: SubmitHandler<VoiceProfileFormValues> = async (data) => {
    if (isLimitReached) {
      setStatusMessage(t('errors.limitReached', { limit: MAX_PROFILES }));
      return;
    }

    const selectedTagData = tags.find((tag) => tag.id === data.selectedTag);

    if (!selectedTagData) {
      setStatusMessage(t('errors.invalidStyle'));
      return;
    }

    setStatusMessage(null);

    try {
      const response = await fetch("/api/voice-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceName: data.voiceName.trim(),
          timezone: data.timezone,
          language: data.language,
          context: data.context.trim(),
          examples: data.examples.map(e => e.value),
          selectedTag: data.selectedTag,
          styleEmoji: selectedTagData.emoji,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | { error?: string }
        | { ok?: boolean }
        | null;

      if (!response.ok) {
        const error =
          json && "error" in json && json.error
            ? json.error
            : t('errors.saveError');
        setStatusMessage(error);
        return;
      }

      reset();
      setProfileCount((current) => {
        const nextCount = (current ?? 0) + 1;
        setIsLimitReached(nextCount >= MAX_PROFILES);
        return nextCount;
      });
      setStatusMessage(t('success'));
    } catch {
      setStatusMessage(t('errors.genericError'));
    }
  };

  return (
    <div className="flex min-h-screen w-full justify-center bg-slate-50 font-sans">
      <main className="flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-12 lg:px-16 lg:py-12">
        <div className="flex flex-col gap-2 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t.rich('title', {
              highlight: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">{chunks}</span>
            })}
          </h1>
          <p className="text-sm font-medium leading-relaxed text-slate-500 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <form className="flex flex-col gap-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:p-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">
                {t('fields.voiceName.label')}
              </label>
              <input
                {...register("voiceName", { required: t('errors.voiceNameRequired') })}
                maxLength={40}
                className={`h-11 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.voiceName ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
                placeholder={t('fields.voiceName.placeholder')}
              />
              {errors.voiceName && <span className="text-xs text-red-500">{errors.voiceName.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">
                {t('fields.timezone.label')}
              </label>
              <div className="relative">
                <Select
                  value={watch("timezone")}
                  onChange={(value) => setValue("timezone", value, { shouldValidate: true })}
                  options={PREDEFINED_TIMEZONES}
                  placeholder={t('fields.timezone.placeholder')}
                  className={errors.timezone ? "border-red-500" : ""}
                />
              </div>
              {errors.timezone && <span className="text-xs text-red-500">{errors.timezone.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">
                {t('fields.language.label')}
              </label>
              <div className="relative">
                <Select
                  value={watch("language")}
                  onChange={(value) => setValue("language", value, { shouldValidate: true })}
                  options={PREDEFINED_LANGUAGES}
                  placeholder={t('fields.language.placeholder')}
                  className={errors.language ? "border-red-500" : ""}
                />
              </div>
              {errors.language && <span className="text-xs text-red-500">{errors.language.message}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              {t('fields.context.label')}
            </label>
            <div className="relative">
              <textarea
                {...register("context", { required: t('errors.contextRequired') })}
                className={`min-h-[100px] w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${errors.context ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
                placeholder={t('fields.context.placeholder')}
                maxLength={2250}
              />
              <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-400 backdrop-blur-sm">
                {watch("context")?.length || 0}/2250
              </div>
            </div>
            {errors.context && <span className="text-xs text-red-500">{errors.context.message}</span>}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-slate-700">
                {t('fields.style.label')}
              </label>
              <p className="text-sm text-slate-500">
                {t('fields.style.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input type="hidden" {...register("selectedTag", { required: t('errors.styleRequired') })} />
              {tags.map((tag) => {
                const isSelected = selectedTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setValue("selectedTag", isSelected ? "" : tag.id, { shouldValidate: true })}
                    className={[
                      "group cursor-pointer flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all outline-none focus:ring-4 focus:ring-blue-500/10",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
                    ].join(" ")}
                  >
                    <span className={isSelected ? "" : "grayscale group-hover:grayscale-0 transition-all"}>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.selectedTag && <span className="text-xs text-red-500">{errors.selectedTag.message}</span>}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">
                {t('fields.examples.label')} <span className="text-slate-400 font-medium">({fields.length}/3)</span>
              </label>
            </div>

            <div className="flex flex-col gap-6">
              {fields.map((field, index) => (
                <div key={field.id} className="group relative flex flex-col gap-2">
                  <div className="relative">
                    <textarea
                      {...register(`examples.${index}.value`)}
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder={t('fields.examples.placeholder')}
                      maxLength={1250}
                    />
                    <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-400 backdrop-blur-sm">
                      {watch(`examples.${index}.value`)?.length || 0}/1250
                    </div>
                  </div>
                  
                  {fields.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                        {t('fields.examples.remove')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {fields.length < 3 && (
              <button
                type="button"
                onClick={addExample}
                className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm font-bold text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                </div>
                {t('fields.examples.add')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            {statusMessage ? (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${statusMessage === t('success') ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {statusMessage}
              </div>
            ) : profileCount !== null ? (
              <p className="text-center text-sm font-medium text-slate-500">
                {t.rich('profileCount', {
                  count: profileCount,
                  max: MAX_PROFILES,
                  highlight: (chunks) => <span className="text-slate-900">{chunks}</span>
                })}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLimitReached}
              className={[
                "inline-flex cursor-pointer h-12 w-full items-center justify-center gap-2 rounded-2xl px-8 text-base font-bold text-white shadow-lg transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
                isLimitReached
                  ? "bg-slate-300 shadow-none"
                  : "bg-blue-600 shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300",
              ].join(" ")}
            >
              <span>{t('submit')}</span>
              {!isLimitReached && <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
