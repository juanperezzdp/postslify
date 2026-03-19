
import type { ScheduledTargetSummary } from "@/types/posts";
import Image from "next/image";
import { getProxiedImageUrl } from "@/lib/image-proxy";
import { useTranslations } from "next-intl";

interface ScheduledProfilesTopProps {
  targets: ScheduledTargetSummary[];
}

export function ScheduledProfilesTop({ targets }: ScheduledProfilesTopProps) {
  const t = useTranslations("Calendar");
  if (targets.length === 0) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
        {t("scheduledTopTitle")}
      </h3>
      <div className="flex flex-wrap gap-4">
        {targets.map((profile) => (
          <div 
            key={profile.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 pr-5 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-100/50"
          >
            <div className="relative h-12 w-12 flex-shrink-0">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100">
                {profile.image ? (
                  <Image
                    src={getProxiedImageUrl(profile.image) || profile.image}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    unoptimized={!!getProxiedImageUrl(profile.image)?.startsWith('/api/proxy-image')}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-lg font-bold text-slate-500">
                    {profile.initial}
                  </div>
                )}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-blue-600 text-[10px] font-bold text-white shadow-sm"
                title={t("scheduledCountTooltip", { count: profile.count })}
              >
                {profile.count}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 line-clamp-1">
                {profile.name}
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                {profile.type === "page" ? t("typePage") : t("typeProfile")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
