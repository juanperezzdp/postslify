"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheckCircle, faEye, faEyeSlash, faLock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useForm } from "react-hook-form";
import { ResetPasswordInputs } from "@/types/auth";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('ResetPassword');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInputs>();

  const password = watch("password");

  useEffect(() => {
    setMounted(true);
    if (!token) {
      setStatus("error");
      setMessage(t('errors.invalidToken'));
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordInputs) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || t('errors.genericError'));
      }

      setStatus("success");
      setMessage(t('successMessage'));
      
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t('errors.genericError'));
    }
  };

  if (!token) {
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
              {t.rich('invalidLinkTitle', {
                br: () => <br />,
                span: (chunks) => <span className="italic text-red-500">{chunks}</span>
              })}
            </h1>
            <p className="max-w-md text-lg text-slate-600 leading-relaxed font-light">
              {t('invalidLinkMessage')}
            </p>
          </div>

          <div className="relative z-10 hidden md:block text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} Postslify Inc. All rights reserved.
          </div>
        </div>

        {/* Error Content */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-7/12 lg:w-1/2 md:px-12 lg:px-24">
          <div className="text-center">
             <div className="mb-6 flex justify-center text-red-500">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8" />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('linkExpiredTitle')}</h3>
             <p className="mb-8 text-slate-500 max-w-sm mx-auto">{t('linkExpiredMessage')}</p>
             <Link 
               href="/forgot-password" 
               className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
             >
               {t('requestNewLink')}
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50 overflow-hidden font-sans">
      
      {/* Brand Section - Left Side */}
      <div className="relative flex w-full flex-col justify-between bg-white p-8 text-slate-900 md:w-5/12 lg:w-1/2 md:p-12 lg:p-16 overflow-hidden border-r border-slate-100">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-100/50 blur-[100px]" />
          <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-indigo-100/40 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent" />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
        </div>

        {/* Content */}
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
        <div className={`relative w-full max-w-[420px] transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {status === "success" ? (
            <div className="rounded-2xl bg-green-50 p-8 text-center border border-green-100 animate-in fade-in zoom-in duration-300">
              <div className="mb-4 flex justify-center text-green-500">
                <FontAwesomeIcon icon={faCheckCircle} className="h-16 w-16 drop-shadow-sm" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-green-800">{t('successTitle')}</h3>
              <p className="text-sm text-green-700 mb-6 leading-relaxed">{message}</p>
              <p className="text-xs text-green-600 font-medium animate-pulse">{t('redirecting')}</p>
              <div className="mt-6">
                 <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                    {t('loginNow')}
                 </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{t('formTitle')}</h2>
                <p className="text-slate-500 text-sm">{t('formSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Password Input */}
                <div className="group relative">
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t('passwordLabel')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                      <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                    </div>
                    <input
                      {...register("password", { 
                        required: t('errors.passwordRequired'),
                        minLength: {
                          value: 8,
                          message: t('errors.passwordMinLength')
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                          message: t('errors.passwordComplexity')
                        },
                      })}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('passwordPlaceholder')}
                      className={`block w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="group relative">
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t('confirmPasswordLabel')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-500">
                      <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                    </div>
                    <input
                      {...register("confirmPassword", { 
                        required: t('errors.confirmPasswordRequired'),
                        validate: (val) => {
                          if (watch('password') !== val) {
                            return t('errors.passwordsNoMatch');
                          }
                        }
                      })}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('passwordPlaceholder')}
                      className={`block w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                      {errors.confirmPassword.message}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
