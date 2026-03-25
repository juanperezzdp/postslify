"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faCircleCheck,
  faTriangleExclamation,
  faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import type { ResetPasswordRequestValues, UserSettingsFormValues } from "@/types/user-settings";
import { useTranslations } from "next-intl";
import { getProxiedImageUrl } from "@/lib/image-proxy";

type StatusState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

interface SettingsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const { data: session } = useSession();
  const t = useTranslations("Settings");
  const [formStatus, setFormStatus] = useState<StatusState>(null);
  const [resetStatus, setResetStatus] = useState<StatusState>(null);
  const [imagePreview, setImagePreview] = useState(session?.user?.image ?? user.image ?? "");

  const currentUser = {
    ...user,
    ...session?.user,
    image: session?.user?.image ?? user.image ?? "",
  };

  const defaultValues = useMemo(
    () => ({
      name: currentUser.name ?? "",
      image: currentUser.image ?? "",
    }),
    [currentUser.name, currentUser.image]
  );

  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    reset: resetSettings,
    setValue: setSettingsValue,
    formState: { errors: settingsErrors, isSubmitting: isSavingSettings },
  } = useForm<UserSettingsFormValues>({
    defaultValues,
  });

  const resetDefaults = useMemo(
    () => ({
      email: currentUser.email ?? "",
    }),
    [currentUser.email]
  );

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetReset,
    formState: { errors: resetErrors, isSubmitting: isRequestingReset },
  } = useForm<ResetPasswordRequestValues>({
    defaultValues: resetDefaults,
  });

  useEffect(() => {
    resetSettings(defaultValues);
  }, [defaultValues, resetSettings]);

  useEffect(() => {
    resetReset(resetDefaults);
  }, [resetDefaults, resetReset]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      const fallbackImage = currentUser?.image ?? "";
      setImagePreview(fallbackImage);
      setSettingsValue("image", fallbackImage, { shouldDirty: true });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      setSettingsValue("image", result, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: UserSettingsFormValues) => {
    setFormStatus(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as
        | { name: string; image: string }
        | { error: string };

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message:
            "error" in data ? data.error : t("messages.updateError"),
        });
        return;
      }

      if ("error" in data) {
        setFormStatus({
          type: "error",
          message: data.error,
        });
        return;
      }

      setFormStatus({
        type: "success",
        message: t("messages.updateSuccess"),
      });
      resetSettings({
        name: data.name,
        image: data.image,
      });
      setImagePreview(data.image);
    } catch {
      setFormStatus({
        type: "error",
        message: t("messages.updateError"),
      });
    }
  };

  const onRequestReset = async (values: ResetPasswordRequestValues) => {
    setResetStatus(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        setResetStatus({
          type: "error",
          message: data.error || t("messages.resetError"),
        });
        return;
      }

      setResetStatus({
        type: "success",
        message: t("messages.resetSuccess"),
      });
    } catch {
      setResetStatus({
        type: "error",
        message: t("messages.resetError"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t("header.title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t("header.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
          <form onSubmit={handleSubmitSettings(onSubmit)} className="space-y-5">
            <div className="group relative">
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {t("form.imageLabel")}
              </label>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {imagePreview ? (
                    <Image
                      src={getProxiedImageUrl(imagePreview) || imagePreview}
                      alt={t("form.imageAlt")}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized={!!getProxiedImageUrl(imagePreview)?.startsWith('/api/proxy-image') || imagePreview.startsWith('data:')}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="profile-image"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    {t("form.imageButton")}
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <p className="text-xs text-slate-500">{t("form.imageHint")}</p>
                </div>
              </div>
              <input type="hidden" {...registerSettings("image")} />
            </div>

            <div className="group relative">
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {t("form.nameLabel")}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder={t("form.namePlaceholder")}
                  className={`block w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
                    settingsErrors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...registerSettings("name", {
                    required: t("errors.nameRequired"),
                    minLength: {
                      value: 2,
                      message: t("errors.nameMinLength"),
                    },
                  })}
                />
              </div>
              {settingsErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                  {settingsErrors.name.message}
                </p>
              )}
            </div>

            <div className="group relative">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {t("form.emailLabel")}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={currentUser.email || ""}
                  readOnly
                  disabled
                  className="block w-full rounded-xl border border-slate-200 bg-slate-100 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-500 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {formStatus && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
                  formStatus.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    formStatus.type === "success"
                      ? faCircleCheck
                      : faTriangleExclamation
                  }
                  className="h-4 w-4"
                />
                {formStatus.message}
              </div>
            )}

            <div className="flex justify-between  items-center gap-4">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white  transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingSettings ? t("buttons.saving") : t("buttons.saveChanges")}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center bg-red-600 gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                {t("buttons.signOut")}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900">{t("reset.title")}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {t("reset.subtitle")}
          </p>
          <form onSubmit={handleSubmitReset(onRequestReset)} className="mt-5 space-y-4">
            <div className="group relative">
              <label
                htmlFor="reset-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {t("reset.emailLabel")}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  placeholder={t("reset.emailPlaceholder")}
                  readOnly
                  aria-readonly="true"
                  className={`block w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
                    resetErrors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...registerReset("email", {
                    required: t("errors.emailRequired"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("errors.emailInvalid"),
                    },
                  })}
                />
              </div>
              {resetErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                  {resetErrors.email.message}
                </p>
              )}
            </div>

            {resetStatus && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
                  resetStatus.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    resetStatus.type === "success"
                      ? faCircleCheck
                      : faTriangleExclamation
                  }
                  className="h-4 w-4"
                />
                {resetStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isRequestingReset}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-6 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRequestingReset ? t("buttons.sending") : t("buttons.sendLink")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
