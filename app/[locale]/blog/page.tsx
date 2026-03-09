import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { blogPosts } from "../../data/blogPosts";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { BlogLocale } from "@/types/blog";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: t.raw("meta.keywords") as string[],
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const landingT = await getTranslations({ locale, namespace: "Landing" });
  const commonT = await getTranslations({ locale, namespace: "Common" });
  const activeLocale: BlogLocale = locale === "es" ? "es" : "en";

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-center p-4">
        <nav className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/20 bg-white/70 px-6 py-3 shadow-lg shadow-blue-900/5 backdrop-blur-md transition-all hover:bg-white/90">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
            </div>
            <span className="font-[family-name:var(--font-tan)] text-lg tracking-tight text-slate-900">
              Postslify
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#services" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              {landingT("nav.services")}
            </Link>
            <Link href="/blog" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
              {landingT("nav.blog")}
            </Link>
            <Link href="/#precios" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              {landingT("nav.pricing")}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95"
            >
              {landingT("nav.login")}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t.rich("title", {
              span: (chunks) => <span className="text-blue-600">{chunks}</span>,
            })}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {blogPosts.map((post) => {
  const postTranslation = post.translations[activeLocale];

  if (!postTranslation) return null; 

  return (
    <article
      key={post.slug}
      className="flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:ring-blue-200"
    >
      <div className="flex items-center gap-x-4 text-xs">
        <time dateTime={post.date} className="text-slate-500">
          {post.date}
        </time>

        {postTranslation.tags?.length > 0 && (
          <span className="relative z-10 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-100">
            {postTranslation.tags[0]}
          </span>
        )}
      </div>

      <div className="group relative">
        <h3 className="mt-3 text-lg font-semibold leading-6 text-slate-900 group-hover:text-slate-600">
          <Link href={`/blog/${post.slug}`}>
            <span className="absolute inset-0" />
            {postTranslation.title}
          </Link>
        </h3>

        <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">
          {postTranslation.excerpt}
        </p>
      </div>

      <div className="relative mt-8 flex items-center gap-x-4">
        <div className="text-sm leading-6">
          <p className="font-semibold text-slate-900">
            {postTranslation.author}
          </p>

          <p className="text-slate-600">
            {t("readTime", { time: postTranslation.readTime })}
          </p>
        </div>
      </div>
    </article>
  );
})}
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <p className="text-xs leading-5 text-slate-500">
                &copy; {new Date().getFullYear()} Postslify. {commonT("footerRights")}
            </p>
        </div>
      </footer>
    </div>
  );
}
