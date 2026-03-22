import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faPenFancy, 
  faCalendarAlt, 
  faMicrophoneLines, 
  faChartLine, 
  faRobot,
  faUsers,
  faImage,
  faBolt,
  faStar,
  faCrown,
  faRocket
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { PostCard } from "@/app/components/PostCard";
import Image from "next/image";
import { Metadata } from "next";
import Marketing  from "@/public/marketing.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Footer } from "../components/Footer";
import TestimonialsSection from "../components/TestimonialsSection";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Postslify - Transforma tu presencia en LinkedIn con IA",
  description:
    "Postslify te ayuda a crear, programar y optimizar tu contenido en LinkedIn. Con perfiles de voz personalizados y herramientas de IA, tu presencia profesional nunca ha sido tan impactante.",
  keywords: [
    "LinkedIn",
    "IA",
    "Generador de posts",
    "Optimización de perfil",
    "Growth hacking",
    "Marketing B2B",
  ],
  openGraph: {
    title: "Postslify - Transforma tu presencia en LinkedIn",
    description:
      "Herramientas de IA para destacar en LinkedIn y conseguir más oportunidades.",
    type: "website",
  },
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });

  if (userId) {
    redirect(`/${userId}/create-post`);
  }

  const services = [
    {
      id: "postGeneration",
      icon: faPenFancy,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "imageGeneration",
      icon: faImage,
      color: "bg-teal-100 text-teal-600",
    },
    {
      id: "smartScheduling",
      icon: faCalendarAlt,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      id: "voiceProfiles",
      icon: faMicrophoneLines,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "analytics",
      icon: faChartLine,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "virtualAssistant",
      icon: faRobot,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "multiAccount",
      icon: faUsers,
      color: "bg-rose-100 text-rose-600",
    },
  ];

  const pricingPlans = [
    {
      id: "start",
      credits: 166,
      price: "$5.00",
      featuresCount: 5,
      icon: faBolt,
      color: "blue",
      popular: false,
    },
    {
      id: "basic",
      credits: 333,
      price: "$10.00",
      featuresCount: 5,
      icon: faStar,
      color: "indigo",
      popular: true,
    },
    {
      id: "advanced",
      credits: 833,
      price: "$25.00",
      featuresCount: 5,
      icon: faRocket,
      color: "purple",
      popular: false,
    },
    {
      id: "expert",
      credits: 1666,
      price: "$50.00",
      featuresCount: 5,
      icon: faCrown,
      color: "gold",
      popular: false,
    },
  ];

  const navItems = [
    { labelKey: "services", href: "#services" },
    { labelKey: "blog", href: "/blog" },
    { labelKey: "pricing", href: "#precios" },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white font-sans text-slate-900">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-center p-4">
        <nav className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/20 bg-white/70 px-6 py-3 shadow-lg shadow-blue-900/5 backdrop-blur-md transition-all hover:bg-white/90">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
            </div>
            <span className="font-[family-name:var(--font-tan)] text-lg tracking-tight text-slate-900">
              Postslify
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.labelKey}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
              >
                {t(`nav.${item.labelKey}`)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
                <LanguageSwitcher />
            </div>
            <Link
                href="/login"
                className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
            >
                {t('nav.login')}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-32 text-center sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8">
          <div className="animate-fade-in-up">
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              {t.rich('hero.title', {
                span: (chunks) => <span className="text-blue-600">{chunks}</span>
              })}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-lg">
              {t('hero.description')}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/login"
              className="group relative flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              {t('hero.cta')}
              <FontAwesomeIcon
                icon={faArrowRight}
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
           
          </div>
        </div>

        <div className="relative mt-20 flex w-full max-w-5xl flex-col items-center justify-center md:flex-row md:gap-12">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-3xl filter" />
          <div className="absolute left-1/4 top-1/3 -z-10 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl filter" />
          <div className="relative z-0 mb-8 scale-90 opacity-80 transition-all duration-500 hover:z-20 hover:scale-100 hover:opacity-100 md:mb-0 md:-mr-12 md:rotate-[-6deg]">
             <div className="relative">
                <span className="absolute -top-3 -left-3 z-10 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 shadow-sm ring-1 ring-red-100">
                  {t('comparison.before')}
                </span>
                <PostCard 
                  authorName="David Miller"
                  authorRole={t('comparison.authorRole')}
                  timeAgo="2d"
                  content={t('comparison.example.before')}
                  likes={12}
                  comments={2}
                  reposts={0}
                  isOptimized={false}
                  avatarUrl="/perfil.png"
                />
             </div>
          </div>

          {/* Arrow */}
          <div className="relative z-10 block md:block py-4 md:py-0">
            <svg
              width="140"
              height="60"
              viewBox="0 0 140 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-500 drop-shadow-md rotate-90 md:rotate-0"
            >
              <defs>
                <linearGradient id="arrow-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path
                d="M 10 40 Q 70 0 130 25"
                stroke="url(#arrow-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
              <path
                d="M118 9 L 130 25 L 115 35"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* After Card */}
          <div className="relative z-20 transition-all duration-500 hover:scale-105 md:rotate-[6deg] mt-10 md:mt-0">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-lg transition duration-500 group-hover:opacity-40" />
            <div className="relative">
                <div className="absolute -top-7 -right-10 z-10 flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600 shadow-sm ring-1 ring-green-100">
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                  <span>{t('comparison.optimized')}</span>
                </div>
                <PostCard 
                  authorName="David Miller"
                  authorRole={t('comparison.authorRole')}
                  timeAgo={t('comparison.timeAgo')}
                  content={t('comparison.example.after')}
                  likes={842}
                  comments={124}
                  reposts={45}
                  views={15400}
                  isOptimized={true}
                  avatarUrl="/perfil.png"
                  postImageUrl={Marketing}
                />
            </div>
          </div>
        </div>

        <section className="mt-32 w-full max-w-7xl ">
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-[1px] shadow-xl shadow-blue-900/10 transition-all hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="absolute inset-0 bg-white" />

            <div className="relative z-10 grid grid-cols-1 gap-16 rounded-[2.4rem] bg-white px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-center lg:px-20">
              <div className="text-left">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                  {t.rich("powerSection.title", {
                    span: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{chunks}</span>,
                  })}
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  {t("powerSection.subtitle")}
                </p>

                <div className="mt-10 space-y-8">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
                      <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("powerSection.items.idealClient.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("powerSection.items.idealClient.desc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200">
                      <FontAwesomeIcon icon={faRobot} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("powerSection.items.rightCommunity.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("powerSection.items.rightCommunity.desc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 ring-1 ring-purple-200">
                      <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("powerSection.items.turnVisibility.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("powerSection.items.turnVisibility.desc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="rounded-2xl bg-blue-50/80 p-4 ring-1 ring-blue-100 transition-all hover:bg-blue-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-semibold">
                      Clics
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      +214%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50/80 p-4 ring-1 ring-indigo-100 transition-all hover:bg-indigo-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 font-semibold">
                      Alcance
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      x3
                    </p>
                  </div>
                  <div className="rounded-2xl bg-purple-50/80 p-4 ring-1 ring-purple-100 transition-all hover:bg-purple-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-purple-600 font-semibold">
                      Leads
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      +78
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl  opacity-30 blur-2xl transition-all group-hover:opacity-50" />
                <Image
                  src={locale === 'es' ? '/mockup-post-es.png' : '/mockup-post.png'}
                  alt="Mockup de posts optimizados en LinkedIn"
                  width={960}
                  height={720}
                  className="relative z-10 block h-auto w-full object-contain drop-shadow-[0_15px_25px_rgba(15,23,42,0.15)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 w-full  max-w-7xl  ">
          <div className="group relative   overflow-hidden rounded-[2.5rem] bg-white p-[1px] shadow-xl shadow-blue-900/10 transition-all hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="absolute inset-0 bg-white" />
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-100/50 blur-[100px] transition-all group-hover:bg-blue-200/50" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-100/50 blur-[100px] transition-all group-hover:bg-indigo-200/50" />
            
            <div className="relative z-10 flex flex-col-reverse gap-16 rounded-[2.4rem] bg-white px-6 py-16 sm:py-24 lg:flex-row lg:items-center lg:px-20">
              <div className="w-full lg:w-1/2 relative flex justify-center">
                
                <Image
                  src="/calendar.png"
                  alt="Calendar View"
                  width={960}
                  height={720}
                  className="relative z-10 block h-auto w-[100%] sm:w-[75%] lg:w-[80%] rounded-lg border border-slate-100 object-contain shadow-blue-200 shadow-lg transition-transform duration-500 hover:scale-105"
                />
              </div>

              <div className="w-full lg:w-1/2 text-left">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                  {t.rich("scheduleSection.title", {
                    span: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">{chunks}</span>,
                  })}
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  {t("scheduleSection.subtitle")}
                </p>

                <div className="mt-10 space-y-8">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("scheduleSection.items.howItWorks.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("scheduleSection.items.howItWorks.desc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                      <FontAwesomeIcon icon={faRocket} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("scheduleSection.items.benefits.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("scheduleSection.items.benefits.desc")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-200">
                      <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {t("scheduleSection.items.calendar.title")}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t("scheduleSection.items.calendar.desc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="rounded-2xl bg-blue-50/80 p-4 ring-1 ring-blue-100 transition-all hover:bg-blue-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-semibold">
                      {t("scheduleSection.metrics.timeSaved.label")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {t("scheduleSection.metrics.timeSaved.value")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50/80 p-4 ring-1 ring-indigo-100 transition-all hover:bg-indigo-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 font-semibold">
                      {t("scheduleSection.metrics.consistency.label")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {t("scheduleSection.metrics.consistency.value")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-purple-50/80 p-4 ring-1 ring-purple-100 transition-all hover:bg-purple-100 hover:scale-105">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-purple-600 font-semibold">
                      {t("scheduleSection.metrics.clarity.label")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {t("scheduleSection.metrics.clarity.value")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div id="services" className="mt-32 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 uppercase tracking-widest">{t('nav.services')}</h2>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {t.rich('services.title', {
                span: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{chunks}</span>
              })}
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
            {services.map((service, index) => {
               const isLast = index === services.length - 1;
               
               return (
                <div
                  key={service.id}
                  className={`group cursor-pointer relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:shadow-blue-900/5 hover:ring-blue-200 ${isLast ? 'sm:col-span-2 lg:col-span-3 lg:flex-row lg:items-center' : ''}`}
                >
                  
                  <div className={`relative z-10 ${isLast ? 'lg:w-1/2' : ''}`}>
                    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${service.color} bg-opacity-10 ring-1 ring-inset ring-current/20`}>
                      <FontAwesomeIcon icon={service.icon} className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {t(`services.items.${service.id}.title`)}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-500">
                      {t(`services.items.${service.id}.desc`)}
                    </p>
                  </div>
                  
                  {isLast && (
                    <div className="relative z-10 mt-8 lg:mt-0 lg:w-1/3 flex justify-end">
                      <span className="font-[family-name:var(--font-tan)] text-5xl text-slate-100 group-hover:text-blue-500 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {!isLast && (
                    <div className="mt-8 flex items-center justify-end">
                      <span className="font-[family-name:var(--font-tan)] text-5xl text-slate-100 group-hover:text-blue-500 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <TestimonialsSection />

        {/* Pricing Section */}
        <div id="precios" className="mt-32 w-full px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">{t('pricing.simplePricing')}</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {t('pricing.title')}
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {t('pricing.description')}
            </p>
          </div>

          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4 lg:gap-x-8 xl:gap-x-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 ring-1 transition-all duration-300 xl:p-10 ${
                  plan.popular
                    ? "bg-blue-950 ring-2 ring-blue-500 shadow-2xl shadow-blue-900/40 z-10 scale-105 hover:scale-[1.07]"
                    : "bg-white ring-slate-200 shadow-sm hover:shadow-xl hover:ring-blue-200 hover:-translate-y-1"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    {t('pricing.mostPopular')}
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3
                      className={`text-lg font-bold leading-8 ${
                        plan.popular ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {t(`pricing.plans.${plan.id}`)}
                    </h3>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        plan.popular ? "bg-white/10 text-blue-400" : "bg-blue-50 text-blue-600"
                    }`}>
                        <FontAwesomeIcon icon={plan.icon} className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                    <span className={`text-sm font-semibold leading-6 ${plan.popular ? "text-slate-300" : "text-slate-500"}`}>{t('pricing.oneTime')}</span>
                  </p>
                  
                  <div className={`mt-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold w-fit ${
                    plan.popular ? "bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/30" : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                  }`}>
                    <FontAwesomeIcon icon={faBolt} className="h-3 w-3" />
                    <span>{plan.credits} {t('pricing.credits')}</span>
                  </div>

                  <ul role="list" className={`mt-8 space-y-4 text-sm leading-6 text-left ${plan.popular ? "text-slate-300" : "text-slate-600"}`}>
                     <li className="flex gap-x-3">
                        <FontAwesomeIcon icon={faCheck} className={`h-5 w-4 flex-none ${plan.popular ? "text-blue-400" : "text-blue-500"}`} aria-hidden="true" />
                        {t('pricing.features.generation')}
                     </li>
                     <li className="flex gap-x-3">
                        <FontAwesomeIcon icon={faCheck} className={`h-5 w-4 flex-none ${plan.popular ? "text-blue-400" : "text-blue-500"}`} aria-hidden="true" />
                        {t('pricing.features.scheduling')}
                     </li>
                     <li className="flex gap-x-3">
                        <FontAwesomeIcon icon={faCheck} className={`h-5 w-4 flex-none ${plan.popular ? "text-blue-400" : "text-blue-500"}`} aria-hidden="true" />
                        {t('pricing.features.voice')}
                     </li>
                     <li className="flex gap-x-3">
                        <FontAwesomeIcon icon={faCheck} className={`h-5 w-4 flex-none ${plan.popular ? "text-blue-400" : "text-blue-500"}`} aria-hidden="true" />
                        {t('pricing.features.publishing')}
                     </li>
                  </ul>
                </div>
                
                <Link
                  href="/login?plan=credits"
                  className={`mt-8 block rounded-xl px-3 py-3 text-center text-sm font-bold leading-6 shadow-sm transition-all active:scale-95 ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20"
                      : "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {t('pricing.buyNow')}
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
             <p className="text-sm text-slate-500">
                {t.rich('pricing.contact', {
                  link: (chunks) => <Link href="/#contact" className="font-semibold text-blue-600 hover:underline">{chunks}</Link>
                })}
             </p>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <section className="mt-32 mb-20 w-full max-w-7xl  relative">
           <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-blue-50/50 to-white" />
           <div className="group relative overflow-hidden rounded-[3rem] bg-blue-600 px-4 py-10 sm:py-32 text-center shadow-2xl shadow-blue-600/20">
              <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500 blur-[80px] transition-all group-hover:bg-blue-400" />
              <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500 blur-[80px] transition-all group-hover:bg-indigo-400" />
              
              
              <div className="relative z-10 mx-auto max-w-3xl">
                <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                   {t('cta.title')}
                </h2>
                <p className="mt-6 text-lg leading-8 text-blue-100">
                   {t('cta.subtitle')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                   <Link 
                     href="/login" 
                     className="rounded-full bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl shadow-black/10 transition-all hover:scale-105 hover:bg-blue-50 hover:shadow-2xl hover:shadow-black/20 active:scale-95"
                   >
                     {t('cta.button')}
                   </Link>
                </div>
              </div>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
