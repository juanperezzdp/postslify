"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { LinkedInFloatingButton } from "./LinkedInFloatingButton";
import { SessionProvider } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import type { Session } from "next-auth";
import { useForm } from "react-hook-form";
import type { TestimonialCreateResponse, TestimonialModalFormValues } from "@/types/testimonial";
import type { UserProfileResponse } from "@/types/user-profile";

function SidebarContainer() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = useTranslations("Sidebar");
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-blue-700 bg-blue-600 px-4 md:hidden">
        <Link href="/" className="text-xl font-tan uppercase text-white">
          Postslify
        </Link>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-1 text-white hover:bg-blue-700"
          aria-label={t("openMenu")}
        >
          <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

export function ClientLayout({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  const pathname = usePathname();
  const t = useTranslations("TestimonialsModal");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  
  
  
  const pathSegments = pathname ? pathname.split('/').filter(Boolean) : [];
  
  const locales = ['en', 'es'];
  const hasLocale = locales.includes(pathSegments[0]);
  const effectiveSegments = hasLocale ? pathSegments.slice(1) : pathSegments;

  
  const publicPaths = ['blog', 'precios', 'login', 'register', 'forgot-password', 'reset-password'];
  const isPublicPath = effectiveSegments.length > 0 && publicPaths.includes(effectiveSegments[0]);

  const shouldShowSidebar = effectiveSegments.length >= 2 && !isPublicPath;
  const routeUserId = effectiveSegments[0];
  const canCheckUser =
    Boolean(routeUserId) &&
    routeUserId === session?.user?.id &&
    !isPublicPath;

  const ratingOptions = useMemo(
    () => [
      { value: 1, emoji: "😡" },
      { value: 2, emoji: "😕" },
      { value: 3, emoji: "😐" },
      { value: 4, emoji: "🙂" },
      { value: 5, emoji: "😍" },
    ],
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialModalFormValues>({
    defaultValues: {
      content: "",
      rating: 5,
    },
  });
  const contentValue = watch("content") ?? "";
  const contentLength = contentValue.length;

  useEffect(() => {
    if (!canCheckUser) return;
    let isActive = true;
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch("/api/user/profile", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Profile error");
        }
        const data = (await response.json()) as UserProfileResponse;
        if (!isActive) return;
        const createdAtTime = new Date(data.createdAt).getTime();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if (!data.hasTestimonial && Date.now() - createdAtTime >= twoDaysMs) {
          setIsModalOpen(true);
        }
      } catch {
        if (!isActive) return;
      } finally {
        if (isActive) setIsLoadingProfile(false);
      }
    };
    loadProfile();
    return () => {
      isActive = false;
    };
  }, [canCheckUser, session?.user?.id]);

  const onSubmit = async (values: TestimonialModalFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: values.content,
          rating: values.rating,
        }),
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      const payload = (await response.json()) as TestimonialCreateResponse;
      setSubmitSuccess(t("success"));
      reset({ content: "", rating: 5 });
      if (payload.item) {
        setIsModalOpen(false);
      }
    } catch {
      setSubmitError(t("error"));
    }
  };

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchInterval={0}>
      {shouldShowSidebar && (
        <>
          <SidebarContainer key={pathname ?? "root"} />
          <LinkedInFloatingButton />
        </>
      )}
      <div className={shouldShowSidebar ? "min-h-screen md:ml-64" : "min-h-screen"}>
        {children}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("close")}
              title={t("close")}
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
            </button>
            <div className="px-6 pb-6 pt-7 text-center">
              <h3 className="text-2xl font-bold text-slate-900">{t("title")}</h3>
              <p className="mt-3 text-sm text-slate-600">{t("description")}</p>

              <div className="mt-6 flex items-center justify-center gap-3">
                {ratingOptions.map((option) => {
                  const isSelected = watch("rating") === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("rating", option.value, { shouldValidate: true })}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span>{option.emoji}</span>
                    </button>
                  );
                })}
              </div>
              {errors.rating && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  {t("ratingRequired")}
                </p>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
                <textarea
                  rows={4}
                  maxLength={600}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder={t("commentPlaceholder")}
                  {...register("content", {
                    required: true,
                    minLength: 10,
                    maxLength: 600,
                  })}
                />
                <div className="text-right text-xs font-medium text-slate-400">
                  {contentLength}/600
                </div>
                {errors.content && (
                  <p className="text-xs font-semibold text-red-500">
                    {errors.content.type === "maxLength"
                      ? t("commentMaxLength")
                      : t("commentRequired")}
                  </p>
                )}

                {submitError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {submitSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingProfile}
                  className="mt-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-70"
                >
                  {isSubmitting ? t("submitting") : t("submit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
