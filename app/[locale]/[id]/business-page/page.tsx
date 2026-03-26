"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import type { BusinessPageFormValues, BusinessPageSaveResponse } from "@/types/business-page";
import type { PageData, PageSettingsResponse } from "@/types/linkedin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faKey, 
  faLock, 
  faSync, 
  faTimes, 
  faShieldHalved,
  faCircleCheck,
  faCircleExclamation,
  faArrowRight,
  faFingerprint,
  faBuilding,
  faCheck,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import { useLocale, useTranslations } from "next-intl";
import { getProxiedImageUrl } from "@/lib/image-proxy";

const isTokenCreatedToday = (createdAt?: string) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  return (
    created.getDate() === now.getDate() &&
    created.getMonth() === now.getMonth() &&
    created.getFullYear() === now.getFullYear()
  );
};

const isTokenExpired = (createdAt?: string | null) => {
  if (!createdAt) return true;
  const createdDate = new Date(createdAt);
  const today = new Date();
  
  // Check if the token is 60 days old (approx 2 months)
  const timeDiff = today.getTime() - createdDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  return daysDiff >= 60;
};

export default function BusinessPage() {
  const t = useTranslations("BusinessPage");
  const locale = useLocale();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessPageFormValues>({
    defaultValues: {
      token: "",
      tokenLong: "",
      page: "",
      clientId: "",
      clientSecret: "",
    },
  });

  const [pageSettings, setPageSettings] = useState<PageSettingsResponse | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [pageFormStatus, setPageFormStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [renewalFormStatus, setRenewalFormStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [listStatus, setListStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeModal, setActiveModal] = useState<
    "token" | "page" | "credentials" | "longToken" | null
  >(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [refreshingUrn, setRefreshingUrn] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const localeTag = locale === "es" ? "es-ES" : "en-US";
  const dateFormatter = new Intl.DateTimeFormat(localeTag);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/linkedin/page-settings", { cache: "no-store" });
      const data = (await response.json()) as PageSettingsResponse;
      setPageSettings(data);
    } catch {
      setPageSettings(null);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleRefreshToken = async (pageUrn: string) => {
    setListStatus(null);
    setRefreshingUrn(pageUrn);
    try {
      const response = await fetch("/api/linkedin/page-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrn }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("status.refresh.error"));
      }
      setListStatus({
        message: t("status.refresh.success"),
        type: "success",
      });
      await loadSettings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("status.refresh.error");
      setListStatus({
        message,
        type: "error",
      });
    } finally {
      setRefreshingUrn(null);
    }
  };

  const confirmDeletePage = async () => {
    if (!pageToDelete) return;
    setListStatus(null);
    try {
      const response = await fetch("/api/linkedin/page-settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrn: pageToDelete }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("status.delete.error"));
      }
      setListStatus({
        message: t("status.delete.success"),
        type: "success",
      });
      await loadSettings();
      setPageToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("status.delete.error");
      setListStatus({
        message,
        type: "error",
      });
    }
  };

  const handleDeletePage = (pageUrn: string) => {
    setPageToDelete(pageUrn);
  };

  const handleReconfigure = (pageUrn: string) => {
    setListStatus(null);
    reset({
      token: "",
      tokenLong: "",
      page: pageUrn,
      clientId: "",
      clientSecret: "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmitPage = async (values: BusinessPageFormValues) => {
    setPageFormStatus(null);

    const token = values.token.trim();
    const page = values.page.trim();

    if (!page || !token) {
      setPageFormStatus({
        message: t("status.page.missingFields"),
        type: "error",
        });
      return;
    }

    try {
      const response = await fetch("/api/linkedin/page-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, page }),
      });

      const data = (await response.json()) as BusinessPageSaveResponse;

      if (!response.ok) {
        throw new Error(data.error || t("status.page.saveError"));
      }

      setPageFormStatus({
        message: t("status.page.saveSuccess"),
        type: "success",
      });
      await loadSettings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("status.page.saveError");
      setPageFormStatus({
        message,
        type: "error",
      });
    }
  };

  const onSubmitRenewal = async (values: BusinessPageFormValues) => {
    setRenewalFormStatus(null);

    const page = values.page.trim();
    const tokenLong = values.tokenLong.trim();
    const clientId = values.clientId?.trim() || "";
    const clientSecret = values.clientSecret?.trim() || "";

    if (!page) {
      setRenewalFormStatus({
        message: t("status.renewal.missingPage"),
        type: "error",
        });
      return;
    }

    if (!tokenLong && !clientId && !clientSecret) {
      setRenewalFormStatus({
        message: t("status.renewal.missingData"),
        type: "error",
        });
      return;
    }

    try {
      const response = await fetch("/api/linkedin/page-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, tokenLong, clientId, clientSecret }),
      });

      const data = (await response.json()) as BusinessPageSaveResponse;

      if (!response.ok) {
        throw new Error(data.error || t("status.renewal.saveError"));
      }

      setRenewalFormStatus({
        message: t("status.renewal.saveSuccess"),
        type: "success",
      });
      await loadSettings();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("status.renewal.saveError");
      setRenewalFormStatus({
        message,
        type: "error",
      });
    }
  };

  const pages: PageData[] = pageSettings?.pages?.length
    ? pageSettings.pages
    : pageSettings?.page
      ? [pageSettings.page]
      : [];

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50/50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <main className="flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:gap-10 sm:px-12 lg:px-16 lg:py-12">
        
        {}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-6 sm:p-10 lg:p-12 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200/50">
          <div className="hidden sm:block absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-500 blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                {t.rich("header.title", {
                  highlight: (chunks) => (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-600">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {t("header.subtitle")}
              </p>
            </div>
            
            <div className="hidden md:block">
               <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  <FontAwesomeIcon icon={faShieldHalved} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t("header.security.title")}</h3>
                  <p className="text-xs font-medium text-slate-500">{t("header.security.subtitle")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {}
          <div className="flex flex-col gap-8 lg:col-span-7">
            
            {}
            <section
              ref={formRef}
              className="group relative overflow-hidden rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/60"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t("initial.title")}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{t("initial.subtitle")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FontAwesomeIcon icon={faKey} className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitPage)} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="page-token" className="text-sm font-bold text-slate-700">
                      {t("forms.token.label")} <span className="font-normal text-slate-400">{t("forms.token.duration")}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveModal("token")}
                      className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {t("forms.token.help")}
                    </button>
                  </div>
                  <div className="relative group/input">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-blue-500">
                      <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                    </div>
                    <input
                      id="page-token"
                      type="password"
                      placeholder={t("forms.token.placeholder")}
                      className="w-full rounded-2xl border-0 bg-slate-50 pl-11 pr-4 py-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/5 outline-none"
                      {...register("token")}
                    />
                  </div>
                  {errors.token?.message && (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-in slide-in-from-left-1">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      {errors.token.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="page-urn" className="text-sm font-bold text-slate-700">
                      {t("forms.page.label")} <span className="font-normal text-slate-400">{t("forms.page.duration")}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveModal("page")}
                      className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {t("forms.page.help")}
                    </button>
                  </div>
                  <div className="relative group/input">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-blue-500">
                      <FontAwesomeIcon icon={faFingerprint} className="h-4 w-4" />
                    </div>
                    <input
                      id="page-urn"
                      type="text"
                      placeholder={t("forms.page.placeholder")}
                      className="w-full rounded-2xl border-0 bg-slate-50 pl-11 pr-4 py-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/5 outline-none"
                      {...register("page", { required: t("forms.page.required") })}
                    />
                  </div>
                  {errors.page?.message && (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-in slide-in-from-left-1">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                      {errors.page.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer mt-4 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-500 px-6 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:bg-blue-600 hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="relative z-10">{isSubmitting ? t("actions.saving") : t("actions.saveConfig")}</span>
                  {!isSubmitting && <FontAwesomeIcon icon={faArrowRight} className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              {pageFormStatus && (
                <div
                  className={`mt-6 flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
                    pageFormStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                      : "bg-red-50 text-red-800 ring-1 ring-red-100"
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                     pageFormStatus.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  }`}>
                    <FontAwesomeIcon 
                      icon={pageFormStatus.type === "success" ? faCheck : faTimes} 
                      className="h-3 w-3"
                    />
                  </div>
                  {pageFormStatus.message}
                </div>
              )}
            </section>

            {/* Formulario 2: Renovación */}
            <section className="group relative overflow-hidden rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/60">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t("renewal.title")}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{t("renewal.subtitle")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FontAwesomeIcon icon={faSync} className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitRenewal)} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="client-id" className="text-sm font-bold text-slate-700">{t("forms.credentials.clientId")}</label>
                    <input
                      id="client-id"
                      type="text"
                      className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/5 outline-none"
                      {...register("clientId")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="client-secret" className="text-sm font-bold text-slate-700">{t("forms.credentials.clientSecret")}</label>
                    <input
                      id="client-secret"
                      type="password"
                      className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/5 outline-none"
                      {...register("clientSecret")}
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setActiveModal("credentials")}
                  className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 w-fit -mt-2"
                >
                  <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
                  {t("forms.credentials.help")}
                </button>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="page-token-long" className="text-sm font-bold text-slate-700">
                      {t("forms.longToken.label")} <span className="font-normal text-slate-400">{t("forms.longToken.duration")}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveModal("longToken")}
                      className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {t("forms.longToken.help")}
                    </button>
                  </div>
                  <input
                    id="page-token-long"
                    type="password"
                    placeholder={t("forms.longToken.placeholder")}
                    className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/5 outline-none"
                    {...register("tokenLong")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer mt-4 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-500 px-6 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:bg-blue-600 hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="relative z-10">{isSubmitting ? t("actions.saving") : t("actions.saveCredentials")}</span>
                  {!isSubmitting && <FontAwesomeIcon icon={faArrowRight} className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
              
              {renewalFormStatus && (
                <div
                  className={`mt-6 flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
                    renewalFormStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                      : "bg-red-50 text-red-800 ring-1 ring-red-100"
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                     renewalFormStatus.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  }`}>
                    <FontAwesomeIcon 
                      icon={renewalFormStatus.type === "success" ? faCheck : faTimes} 
                      className="h-3 w-3"
                    />
                  </div>
                  {renewalFormStatus.message}
                </div>
              )}
            </section>
          </div>

          {/* Columna Derecha: Lista de Páginas */}
          <div className="lg:col-span-5">
            <section className="sticky top-8 rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FontAwesomeIcon icon={faBuilding} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-00">{t("list.title")}</h2>
                  <p className="text-sm font-medium text-slate-500">{t("list.subtitle")}</p>
                </div>
              </div>

              {listStatus && (
                <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                  listStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-red-50 text-red-700 ring-1 ring-red-100"
                }`}>
                  {listStatus.message}
                </div>
              )}

              {isLoadingSettings ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-slate-50" />
                  ))}
                </div>
              ) : pages.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {pages.map((page) => (
                    <div
                      key={page.urn}
                      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          {page.logoUrl ? (
                            <Image
                              src={getProxiedImageUrl(page.logoUrl) || page.logoUrl}
                              alt={page.name || t("list.card.logoAltFallback")}
                              width={56}
                              height={56}
                              className={`rounded-2xl object-cover ring-4 ring-slate-50 ${
                                page.isValid === false ? "opacity-50 grayscale" : ""
                              }`}
                              unoptimized={!!getProxiedImageUrl(page.logoUrl)?.startsWith('/api/proxy-image')}
                            />
                          ) : (
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold shadow-inner ring-4 ring-slate-50 ${
                              page.isValid === false
                                ? "bg-red-50 text-red-500"
                                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            }`}>
                              {(page.name || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {page.name || t("list.card.defaultName")}
                            </h3>
                            <p className="mt-1 inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-[10px] font-mono font-medium text-slate-500 ring-1 ring-slate-200">
                              {page.urn}
                            </p>
                          </div>
                        </div>

                        {page.isValid !== false ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                            <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        {page.canRefresh && isTokenExpired(page.createdAt) && (
                          <button
                            type="button"
                            disabled={refreshingUrn === page.urn}
                            onClick={() => handleRefreshToken(page.urn)}
                            className="cursor-pointer flex-1 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {refreshingUrn === page.urn ? t("actions.refreshing") : t("actions.refresh")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleReconfigure(page.urn)}
                          className="cursor-pointer flex-1 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          {t("actions.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(page.urn)}
                          className="cursor-pointer flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                        >
                          {t("actions.delete")}
                        </button>
                      </div>
                      
                      {page.createdAt && (
                         <div className="mt-4 border-t border-slate-50 pt-3 text-center">
                           <p className="text-[10px] font-medium text-slate-400">
                             {t("list.card.lastRenewalLabel")} <span className="text-slate-600">{dateFormatter.format(new Date(page.createdAt))}</span>
                           </p>
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                  <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                    <FontAwesomeIcon icon={faBuilding} className="h-8 w-8" />
                  </div>
                  <p className="text-base font-bold text-slate-900">{t("list.empty.title")}</p>
                  <p className="mt-2 max-w-[200px] text-sm text-slate-500">
                    {t("list.empty.subtitle")}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Modals - Enhanced Glassmorphism */}
        <InfoModal
          isOpen={activeModal === "token"}
          onClose={() => setActiveModal(null)}
          title={t("modals.token.title")}
        >
          <div className="flex flex-col gap-6 text-slate-600">
            <p className="leading-relaxed">
              {t("modals.token.intro")}
            </p>
            <ol className="list-decimal space-y-4 pl-4 marker:font-bold marker:text-slate-400">
              <li className="pl-2">
                {t.rich("modals.token.steps.portal", {
                  link: (chunks) => (
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:underline decoration-2 underline-offset-2"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </li>
              <li className="pl-2">
                {t.rich("modals.token.steps.authIntro", {
                  strong: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                })}
                <ul className="mt-2 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-xs font-medium">
                  <li className="flex items-center gap-2"><FontAwesomeIcon icon={faCheck} className="text-emerald-500 h-3 w-3" /> {t("modals.token.steps.authList.redirect")}</li>
                  <li className="flex items-center gap-2"><FontAwesomeIcon icon={faCheck} className="text-emerald-500 h-3 w-3" /> {t("modals.token.steps.authList.credentials")}</li>
                </ul>
              </li>
              <li className="pl-2">
                {t.rich("modals.token.steps.products", {
                  strong: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                })}
              </li>
              <li className="pl-2">
                {t("modals.token.steps.scopesLabel")}{" "}
                <div className="mt-2 flex flex-wrap gap-2">
                  <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800 border border-slate-200">r_organization_admin</code>
                  <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800 border border-slate-200">w_organization_social</code>
                </div>
              </li>
            </ol>
            <div className="mt-2 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{t("modals.token.warning")}</p>
            </div>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={activeModal === "page"}
          onClose={() => setActiveModal(null)}
          title={t("modals.page.title")}
        >
          <div className="flex flex-col gap-6 text-slate-600">
            <p className="leading-relaxed">{t("modals.page.intro")}</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t("modals.page.browserLabel")}
              </div>
              <div className="p-4 bg-white">
                <code className="break-all text-xs font-mono text-slate-400">
                  linkedin.com/company/<span className="rounded bg-blue-100 px-1 py-0.5 font-bold text-blue-700">12345678</span>/admin/...
                </code>
              </div>
            </div>
            <p className="text-sm">
              {t("modals.page.highlighted")}
              <br />
              <code className="mt-2 inline-block rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                urn:li:organization:12345678
              </code>
            </p>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={activeModal === "credentials"}
          onClose={() => setActiveModal(null)}
          title={t("modals.credentials.title")}
        >
          <div className="flex flex-col gap-6 text-slate-600">
            <p className="leading-relaxed">
              {t("modals.credentials.intro")}
            </p>
            <ol className="list-decimal space-y-3 pl-4 marker:font-bold marker:text-slate-400">
              <li className="pl-2">
                {t.rich("modals.credentials.steps.portal", {
                  link: (chunks) => (
                    <a
                      href="https://www.linkedin.com/developers/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:underline decoration-2 underline-offset-2"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </li>
              <li className="pl-2">{t("modals.credentials.steps.selectApp")}</li>
              <li className="pl-2">
                {t.rich("modals.credentials.steps.authPath", {
                  strong: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                })}
              </li>
              <li className="pl-2">{t.rich("modals.credentials.steps.copy", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}</li>
            </ol>
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 ring-1 ring-blue-100 flex gap-3">
              <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{t("modals.credentials.note")}</p>
            </div>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={activeModal === "longToken"}
          onClose={() => setActiveModal(null)}
          title={t("modals.longToken.title")}
        >
          <div className="flex flex-col gap-6 text-slate-600">
            <p className="leading-relaxed">
              {t.rich("modals.longToken.intro", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                </div>
                <span>{t("modals.longToken.points.auto")}</span>
              </li>
              <li className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                </div>
                <span>
                  {t.rich("modals.longToken.points.prefix", {
                    code: (chunks) => (
                      <code className="font-mono text-xs font-bold bg-slate-100 px-1 rounded border border-slate-200">{chunks}</code>
                    ),
                  })}
                </span>
              </li>
              <li className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                </div>
                <span>{t("modals.longToken.points.oauth")}</span>
              </li>
            </ul>
          </div>
        </InfoModal>

        {/* Delete Confirmation Modal */}
        {pageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
             <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center p-8 text-center">
                   <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-inner ring-1 ring-red-100">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="h-10 w-10" />
                   </div>
                  <h3 className="text-2xl font-bold text-slate-900">{t("delete.title")}</h3>
                   <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                      {t.rich("delete.description", {
                        lineBreak: () => <br />,
                        warning: (chunks) => <span className="text-red-500 font-bold">{chunks}</span>,
                      })}
                   </p>
                   
                   <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => setPageToDelete(null)}
                        className="cursor-pointer flex-1 rounded-2xl bg-slate-100 px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {t("actions.cancel")}
                      </button>
                      <button
                        onClick={confirmDeletePage}
                        className="cursor-pointer flex-1 rounded-2xl bg-red-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-[1.02] transition-all"
                      >
                        {t("actions.confirmDelete")}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-300">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer group rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
