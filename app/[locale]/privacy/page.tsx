import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });

  const sections = [
    "introduction",
    "informationCollection",
    "useOfInformation",
    "dataSharing",
    "dataSecurity",
    "userRights",
    "cookies",
    "changes",
    "contact"
  ] as const;

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-slate-700">
        <p className="text-base font-semibold leading-7 text-blue-600">{t("label")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-[family-name:var(--font-tan)]">
          {t("title")}
        </h1>
        <p className="mt-6 text-xl leading-8 text-slate-600">
          {t("intro")}
        </p>
        <div className="mt-10 max-w-2xl">
          <p className="mb-8 font-semibold text-slate-900">{t("lastUpdated")}</p>
          <div className="prose prose-slate prose-lg max-w-none">
            {sections.map((section) => (
              <div key={section} className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{t(`sections.${section}.title`)}</h2>
                <div className="whitespace-pre-line text-slate-600">
                  {t.rich(`sections.${section}.content`, {
                    ul: (chunks) => <ul className="list-disc pl-5 my-2 space-y-1">{chunks}</ul>,
                    li: (chunks) => <li>{chunks}</li>,
                    strong: (chunks) => <strong className="font-semibold text-slate-800">{chunks}</strong>
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
