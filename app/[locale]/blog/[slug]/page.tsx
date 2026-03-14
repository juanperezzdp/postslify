import { blogPosts } from "../../../data/blogPosts";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faArrowLeft, faCalendar, faUser, faClock } from "@fortawesome/free-solid-svg-icons";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { BlogLocale } from "@/types/blog";
import Image from "next/image";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  const t = await getTranslations({ locale, namespace: "Blog" });

  if (!post) {
    return {
      title: t("postNotFoundTitle"),
    };
  }

  const activeLocale: BlogLocale = locale === "es" ? "es" : "en";
  const postTranslation = post.translations[activeLocale];

  return {
    title: `${postTranslation.title} - ${t("meta.blogSuffix")}`,
    description: postTranslation.excerpt,
    keywords: postTranslation.tags,
    openGraph: {
      title: postTranslation.title,
      description: postTranslation.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [postTranslation.author],
    },
  };
}

export async function generateStaticParams() {
  const locales: BlogLocale[] = ["en", "es"];
  return locales.flatMap((locale) =>
    blogPosts.map((post) => ({
      slug: post.slug,
      locale,
    }))
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  const t = await getTranslations({ locale, namespace: "Blog" });
  const landingT = await getTranslations({ locale, namespace: "Landing" });
  const commonT = await getTranslations({ locale, namespace: "Common" });

  if (!post) {
    notFound();
  }

  const activeLocale: BlogLocale = locale === "es" ? "es" : "en";
  const postTranslation = post.translations[activeLocale];

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white font-sans text-slate-900">
      {/* Navbar */}
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
        <article className="mx-auto w-full max-w-3xl">
            <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
                <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                {t("backToBlog")}
            </Link>
            
            <div className="mb-8 flex flex-wrap gap-4">
                {postTranslation.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100">
                        {tag}
                    </span>
                ))}
            </div>

            <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {postTranslation.title}
            </h1>

            <div className="mb-10 flex items-center gap-6 border-b border-slate-100 pb-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                    <span>{postTranslation.author}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                    <time dateTime={post.date}>{post.date}</time>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                    <span>{t("readTime", { time: postTranslation.readTime })}</span>
                </div>
            </div>

            {post.imageUrl && (
              <div className="mb-10 overflow-hidden rounded-2xl shadow-lg shadow-blue-900/5">
                <Image
                  src={post.imageUrl}
                  alt={postTranslation.title}
                  width={1200}
                  height={630}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            )}

            <div 
                className="blog-content prose prose-lg prose-slate prose-headings:font-bold prose-headings:mt-12 prose-headings:mb-6 prose-p:mb-8 prose-li:mb-2 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-p:leading-relaxed prose-li:leading-relaxed max-w-none"
                dangerouslySetInnerHTML={{ __html: postTranslation.content }} 
            />
            
            <div className="mt-16 rounded-2xl bg-slate-50 p-8 text-center">
                <h3 className="text-xl font-bold text-slate-900">{t("cta.title")}</h3>
                <p className="mt-2 text-slate-600">{t("cta.subtitle")}</p>
                <Link
                    href="/login"
                    className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                >
                    {t("cta.button")}
                </Link>
            </div>
        </article>
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
