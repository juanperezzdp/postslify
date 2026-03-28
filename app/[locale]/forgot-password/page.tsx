"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faArrowLeft, faCheckCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useForm } from "react-hook-form";
import type { WelcomeEmailLocale } from "@/types/mail";
import { useLocale, useTranslations } from "next-intl";
import { ForgotPasswordInputs } from "@/types/auth";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('ForgotPassword');
  const currentLocale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setStatus("loading");
    setMessage("");
    const locale: WelcomeEmailLocale = currentLocale === "es" ? "es" : "en";

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Something went wrong");
      }
      
      setStatus("success");
      setMessage(t('successMessage'));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errors.genericError');
      setStatus("error");
      setMessage(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50 overflow-hidden font-sans">
      
      {}
      <div className="relative flex w-full flex-col justify-between bg-white p-8 text-slate-900 md:w-5/12 lg:w-1/2 md:p-12 lg:p-16 overflow-hidden border-r border-slate-100">
        {}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100/50 blur-[100px]" />
          <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-indigo-100/40 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent" />
          
          {}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
        </div>

        {}
        <div className={`relative z-10 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center gap-3 text-blue-600">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 backdrop-blur-md ring-1 ring-slate-200">
               <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
            </div>
            <span className="font-[family-name:var(--font-tan)] text-lg tracking-tight text-slate-900">Postslify</span>
          </div>
        </div>

        <div className={`relative z-10 my-12 md:my-0 transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="font-tan text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-600 drop-shadow-sm">
            {t.rich('title', {
              br: () => <br />,
              span: (chunks) => <span className="italic text-blue-600">{chunks}</span>
            })}
          </h1>
          <p className="max-w-md text-lg text-slate-600 leading-relaxed font-light">
            {t('subtitle')}
          </p>
        </div>

        <div className="relative z-10 hidden md:block text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Postslify Inc. All rights reserved.
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-7/12 lg:w-1/2 md:px-12 lg:px-24">
        <div className={`w-full max-w-[420px] transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="mb-10 text-center md:text-left">
            <Link 
              href="/login" 
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              {t('backToLogin')}
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{t('formTitle')}</h2>
            <p className="text-slate-500 text-sm">{t('formSubtitle')}</p>
          </div>

          {status === "success" ? (
            <div className="rounded-2xl bg-green-50 p-8 text-center border border-green-100 animate-in fade-in zoom-in duration-300">
              <div className="mb-4 flex justify-center text-green-500">
                <FontAwesomeIcon icon={faCheckCircle} className="h-16 w-16 drop-shadow-sm" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-green-800">{t('successTitle')}</h3>
              <p className="text-sm text-green-700 mb-6 leading-relaxed">{message}</p>
              <Link 
                href="/login" 
                className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {t('returnToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <div className="group relative">
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                    <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                  </div>
                  <input
                    {...register("email", { 
                      required: t('errors.emailRequired'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('errors.emailInvalid')
                      }
                    })}
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className={`block w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {status === "error" && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in fade-in zoom-in duration-200 flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                   {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {status === "loading" ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                      {t('submittingButton')}
                    </>
                  ) : (
                    t('submitButton')
                  )}
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </form>
          )}

          
        </div>
      </div>
    </div>
  );
}
