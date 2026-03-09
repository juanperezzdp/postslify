"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faUser, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useForm } from "react-hook-form";
import { RegisterInputs } from "@/types/auth";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations('Register');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInputs>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (data: RegisterInputs) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        const message =
          res.status === 409
            ? t("errors.emailExists")
            : responseData?.error || t("errors.genericError");
        setError(message);
        return;
      }

      
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row-reverse bg-slate-50 overflow-hidden font-sans">
      
      {}
      <div className="relative flex w-full flex-col justify-between bg-white p-8 text-slate-900 md:w-5/12 lg:w-1/2 md:p-12 lg:p-16 overflow-hidden border-l border-slate-100">
        {}
        <div className="absolute inset-0 z-0">
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-100/50 blur-[100px]" />
          <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-indigo-100/40 blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent" />
          
          {}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
        </div>

        {}
        <div className={`relative z-10 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center gap-3 text-blue-600 justify-end">
            <span className="font-[family-name:var(--font-tan)] text-lg tracking-tight text-slate-900">Postslify</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 backdrop-blur-md ring-1 ring-slate-200">
               <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className={`relative z-10 my-12 md:my-0 transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="font-tan text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-l from-slate-900 via-blue-900 to-slate-600 drop-shadow-sm text-right">
            {t.rich('heroTitle', {
              br: () => <br />,
              span: (chunks) => <span className="italic text-blue-600">{chunks}</span>
            })}
          </h1>
          <p className="ml-auto max-w-md text-lg text-slate-600 leading-relaxed font-light text-right">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="relative z-10 hidden md:block text-xs text-slate-500 font-medium text-right">
          © {new Date().getFullYear()} Postslify Inc.
        </div>
      </div>

      {/* Form Section - Left Side */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-7/12 lg:w-1/2 md:px-12 lg:px-24">
        <div className={`w-full max-w-[420px] transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{t('title')}</h2>
            <p className="text-slate-500 text-sm">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Input */}
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
              </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder={t('namePlaceholder')}
                className={`w-full rounded-xl border bg-slate-50/50 px-11 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-50 ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-blue-500"
                }`}
                {...register("name", { required: t('errors.nameRequired') })}
              />
              {errors.name && (
                <span className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Email Input */}
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                className={`w-full rounded-xl border bg-slate-50/50 px-11 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-50 ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-blue-500"
                }`}
                {...register("email", { 
                  required: t('errors.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('errors.emailInvalid')
                  }
                })}
              />
              {errors.email && (
                <span className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="group relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
                <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t('passwordPlaceholder')}
                className={`w-full rounded-xl border bg-slate-50/50 px-11 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-50 ${
                  errors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-blue-500"
                }`}
                {...register("password", { 
                  required: t('errors.passwordRequired'),
                  minLength: {
                    value: 8,
                    message: t('errors.passwordMinLength')
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: t('errors.passwordRequirements')
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" />
                ) : (
                  <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                )}
              </button>
              {errors.password && (
                <span className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="group relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
                <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t('confirmPasswordPlaceholder')}
                className={`w-full rounded-xl border bg-slate-50/50 px-11 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-50 ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-blue-500"
                }`}
                {...register("confirmPassword", { 
                  required: t('errors.confirmPasswordRequired'),
                  validate: (val) => {
                    if (watch('password') != val) {
                      return t('errors.passwordsNoMatch');
                    }
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? (
                  <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" />
                ) : (
                  <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                )}
              </button>
              {errors.confirmPassword && (
                <span className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-4 w-full overflow-hidden rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                   <>
                     <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                     <span>{t('submittingButton')}</span>
                   </>
                ) : (
                   <>
                     <span>{t('submitButton')}</span>
                     <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                   </>
                )}
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {t('haveAccount')}{" "}
              <Link href="/login" className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                {t('loginLink')}
              </Link>
            </p>
          </div>
          
          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                 <span className="font-bold text-xs">!</span>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          
        </div>
      </div>
    </div>
  );
}
