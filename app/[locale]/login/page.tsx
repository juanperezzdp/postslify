"use client";

import { useState, useEffect } from "react";
import { authenticate } from "./actions";
import { Link } from "@/i18n/routing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowRight, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useForm } from "react-hook-form";
import { LoginInputs } from "@/types/auth";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const t = useTranslations('Login');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (data: LoginInputs) => {
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("locale", locale);
    if (callbackUrl) {
      formData.append("callbackUrl", callbackUrl);
    }

    const error = await authenticate(undefined, formData);
    if (error) {
      setErrorMessage(error);
      setIsPending(false);
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
             {t.rich("heroTitle", {
  br: () => <br />,
  span: (chunks) => (
    <span className="italic text-blue-600">
      {chunks}
    </span>
  ),
})}
          </h1>
          <p className="max-w-md text-lg text-slate-600 leading-relaxed font-light">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="relative z-10 hidden md:block text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} {t('footerRights')}
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-7/12 lg:w-1/2 md:px-12 lg:px-24">
        <div className={`w-full max-w-[420px] transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{t('title')}</h2>
            <p className="text-slate-500 text-sm">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {callbackUrl && (
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
            )}
            <input type="hidden" name="locale" value={locale} />
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
                  required: t('emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('emailInvalid')
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
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                className={`w-full rounded-xl border bg-slate-50/50 px-11 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:bg-slate-50 ${
                  errors.password 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-slate-200 focus:border-blue-500"
                }`}
                {...register("password", { required: t('passwordRequired') })}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                 <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">{t('rememberMe')}</label>
              </div>
              <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              aria-disabled={isPending}
              disabled={isPending}
              className="group relative w-full overflow-hidden rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isPending ? (
                   <>
                     <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                     <span>{t('loggingIn')}</span>
                   </>
                ) : (
                   <>
                     <span>{t('signIn')}</span>
                     <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                   </>
                )}
              </div>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </form>

           {/* Sign Up Link */}
           <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {t('noAccount')}{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-all">
                {t('signUp')}
              </Link>
            </p>
          </div>

           {/* Error Message */}
           {errorMessage && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-500 animate-in fade-in slide-in-from-bottom-2">
              <p className="font-medium">Authentication Error</p>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
