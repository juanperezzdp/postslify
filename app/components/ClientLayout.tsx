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

function SidebarContainer({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}) {
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
          <FontAwesomeIcon icon={faBars} className="h-6 w-6 text-2xl" />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

export function ClientLayout({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  const pathname = usePathname();
  const t = useTranslations("TestimonialsModal");
  const tOnboarding = useTranslations("Onboarding");
  const tWelcome = useTranslations("WelcomeBonus");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isMobileTour, setIsMobileTour] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  
  
  
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
  const onboardingKey = "postslify_onboarding_v1";
  const forceOnboardingPreview = false;
  const onboardingSteps = useMemo(
    () => [
      {
        id: "nav-voice-profile",
        title: tOnboarding("steps.voice.title"),
        description: tOnboarding("steps.voice.description"),
      },
      {
        id: "nav-create-post",
        title: tOnboarding("steps.post.title"),
        description: tOnboarding("steps.post.description"),
      },
      {
        id: "nav-calendar",
        title: tOnboarding("steps.calendar.title"),
        description: tOnboarding("steps.calendar.description"),
      },
      {
        id: "nav-archived",
        title: tOnboarding("steps.archived.title"),
        description: tOnboarding("steps.archived.description"),
      },
      {
        id: "nav-voice-profiles",
        title: tOnboarding("steps.voiceProfiles.title"),
        description: tOnboarding("steps.voiceProfiles.description"),
      },
      {
        id: "nav-business",
        title: tOnboarding("steps.business.title"),
        description: tOnboarding("steps.business.description"),
      },
      {
        id: "nav-billing",
        title: tOnboarding("steps.billing.title"),
        description: tOnboarding("steps.billing.description"),
      },
      {
        id: "nav-user-details",
        title: tOnboarding("steps.userDetails.title"),
        description: tOnboarding("steps.userDetails.description"),
      },
    ],
    [tOnboarding],
  );

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
        const data = (await response.json()) as UserProfileResponse & { welcomeBonusSeen?: boolean };
        if (!isActive) return;
        
        // Manejar el modal de bienvenida
        if (data.welcomeBonusSeen === false) {
          setShowWelcomeBonus(true);
        }

        const createdAtTime = new Date(data.createdAt).getTime();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        // Solo mostramos el modal de testimonial si no estamos mostrando el de bienvenida
        if (data.welcomeBonusSeen !== false && !data.hasTestimonial && Date.now() - createdAtTime >= twoDaysMs) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobileTour(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!shouldShowSidebar || !session?.user?.id) return;
    if (typeof window === "undefined") return;
    const isDone = window.localStorage.getItem(onboardingKey) === "1";
    if (isDone && !forceOnboardingPreview) return;
    setIsOnboardingOpen(true);
    setOnboardingStep(0);
    setIsSidebarOpen(true);
  }, [shouldShowSidebar, session?.user?.id]);

  useEffect(() => {
    if (!isOnboardingOpen) return;
    const step = onboardingSteps[onboardingStep];
    if (!step) return;
    const update = () => {
      const element = document.querySelector(
        `[data-onboarding-id="${step.id}"]`,
      ) as HTMLElement | null;
      if (!element) {
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOnboardingOpen, onboardingStep, onboardingSteps]);

  const totalSteps = onboardingSteps.length;
  const currentStep = onboardingSteps[onboardingStep];
  const closeOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(onboardingKey, "1");
    }
    setIsOnboardingOpen(false);
    if (isMobileTour) {
      setIsSidebarOpen(false);
    }
  };
  const goNext = () => {
    if (onboardingStep >= totalSteps - 1) {
      closeOnboarding();
      return;
    }
    setOnboardingStep((prev) => prev + 1);
  };
  const tooltipStyle = useMemo(() => {
    if (!targetRect) return undefined;
    if (typeof window === "undefined") return undefined;
    const tooltipWidth = 280;
    const tooltipHeight = 200;
    if (isMobileTour) {
      const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
      const spaceAbove = targetRect.top;
      const placeBelow = spaceBelow >= tooltipHeight + 24 || spaceBelow >= spaceAbove;
      const top = placeBelow
        ? Math.min(
            window.innerHeight - tooltipHeight - 16,
            targetRect.top + targetRect.height + 12,
          )
        : Math.max(16, targetRect.top - tooltipHeight - 12);
      return {
        top,
        left: 16,
        right: 16,
        width: "auto",
      } as React.CSSProperties;
    }
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;
    const placeBelow = spaceBelow >= tooltipHeight + 24 || spaceBelow >= spaceAbove;
    const top = placeBelow
      ? Math.min(
          window.innerHeight - tooltipHeight - 16,
          targetRect.top + targetRect.height + 12,
        )
      : Math.max(16, targetRect.top - tooltipHeight - 12);
    const left = Math.min(
      window.innerWidth - tooltipWidth - 16,
      Math.max(16, targetRect.left),
    );
    return { top, left };
  }, [targetRect, isMobileTour]);

  const closeWelcomeBonus = async () => {
    setShowWelcomeBonus(false);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ welcome_bonus_seen: true }),
      });
    } catch (error) {
      console.error("Failed to update welcome bonus flag:", error);
    }
  };

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
          <SidebarContainer
            key={pathname ?? "root"}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
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
      {showWelcomeBonus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              onClick={closeWelcomeBonus}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl shadow-inner backdrop-blur-md">
                🎁
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{tWelcome("title")}</h2>
              <p className="mt-2 text-blue-100">
                {tWelcome("subtitle")}
              </p>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-base text-slate-600">
                {tWelcome.rich("gift", {
                  highlight: (chunks) => <strong className="text-slate-900">{chunks}</strong>,
                })}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {tWelcome("description")}
              </p>
              <button
                onClick={closeWelcomeBonus}
                className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-600/30"
              >
                {tWelcome("button")}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {shouldShowSidebar && isOnboardingOpen && currentStep && !showWelcomeBonus && (
        <div className="fixed inset-0 z-[85]">
          {targetRect && (
            <div
              className="fixed rounded-2xl ring-2 ring-white/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.6)]"
              style={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
            />
          )}
          <div
            className="fixed z-[86] w-[280px] rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200"
            style={tooltipStyle}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-500">
              {tOnboarding("kicker", { current: onboardingStep + 1, total: totalSteps })}
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {currentStep.title}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {currentStep.description}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeOnboarding}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                {tOnboarding("skip")}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              >
                {onboardingStep >= totalSteps - 1
                  ? tOnboarding("done")
                  : tOnboarding("next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
