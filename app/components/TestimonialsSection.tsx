"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { useLocale, useTranslations } from "next-intl";
import type {
  Testimonial,
  TestimonialListResponse,
} from "@/types/testimonial";

export default function TestimonialsSection() {
  const t = useTranslations("Landing.testimonials");
  const locale = useLocale();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const starArray = useMemo(() => [1, 2, 3, 4, 5], []);
  const shouldCarousel = !isLoading && items.length > 3;
  const visibleItemsLarge = useMemo(() => items.slice(-10), [items]);
  const visibleItemsSmall = useMemo(() => items.slice(-3), [items]);
  const formatDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/testimonials", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Fetch failed");
        }
        const data = (await response.json()) as TestimonialListResponse;
        setItems(data.items);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="mt-32 w-full px-6 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {t.rich("title", {
            span: (chunks) => <span className="text-blue-600">{chunks}</span>,
          })}
        </h2>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {t("subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-56 rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {t("empty")}
          </div>
        ) : shouldCarousel ? (
          <>
            <div className="hidden sm:block">
              <div className="relative overflow-hidden">
                <div className="testimonial-track">
                  <div className="testimonial-group">
                    {visibleItemsLarge.map((item) => (
                      <article
                        key={item.id}
                        className="testimonial-card relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
                        <div className="absolute right-5 top-6 text-blue-100">
                          <FontAwesomeIcon icon={faQuoteLeft} className="h-7 w-7" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-blue-800 text-sm font-semibold text-white">
                                    {item.name.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                {item.createdAt && (
                                  <p className="text-xs font-medium text-slate-400">
                                    {formatDate(item.createdAt)}
                                  </p>
                                )}
                                {(item.role || item.company) && (
                                  <p className="text-xs text-slate-500">
                                    {[item.role, item.company].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-blue-500">
                              {starArray.slice(0, item.rating ?? 5).map((star) => (
                                <FontAwesomeIcon key={star} icon={faStar} className="text-sm sm:text-xl" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {item.content}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="testimonial-group" aria-hidden>
                    {visibleItemsLarge.map((item) => (
                      <article
                        key={`${item.id}-dup`}
                        className="testimonial-card relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
                        <div className="absolute right-5 top-6 text-blue-100">
                          <FontAwesomeIcon icon={faQuoteLeft} className="h-7 w-7" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-blue-800 text-sm font-semibold text-white">
                                    {item.name.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                {item.createdAt && (
                                  <p className="text-xs font-medium text-slate-400">
                                    {formatDate(item.createdAt)}
                                  </p>
                                )}
                                {(item.role || item.company) && (
                                  <p className="text-xs text-slate-500">
                                    {[item.role, item.company].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-blue-500">
                              {starArray.slice(0, item.rating ?? 5).map((star) => (
                                <FontAwesomeIcon key={star} icon={faStar} className="h-3.5 w-3.5" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {item.content}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/85 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/85 to-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:hidden">
              {visibleItemsSmall.map((item) => (
                <article
                  key={item.id}
                  className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
                  <div className="absolute right-5 top-6 text-blue-100">
                    <FontAwesomeIcon icon={faQuoteLeft} className="h-7 w-7" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-800 text-sm font-semibold text-white">
                              {item.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </p>
                          {item.createdAt && (
                            <p className="text-xs font-medium text-slate-400">
                              {formatDate(item.createdAt)}
                            </p>
                          )}
                          {(item.role || item.company) && (
                            <p className="text-xs text-slate-500">
                              {[item.role, item.company].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-blue-500">
                        {starArray.slice(0, item.rating ?? 5).map((star) => (
                          <FontAwesomeIcon key={star} icon={faStar} className="h-3.5 w-3.5" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {item.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {visibleItemsLarge.map((item) => (
              <article
                key={item.id}
                className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
                <div className="absolute right-5 top-6 text-blue-100">
                  <FontAwesomeIcon icon={faQuoteLeft} className="h-7 w-7" />
                </div>
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-800 text-sm font-semibold text-white">
                            {item.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>
                        {item.createdAt && (
                          <p className="text-xs font-medium text-slate-400">
                            {formatDate(item.createdAt)}
                          </p>
                        )}
                        {(item.role || item.company) && (
                          <p className="text-xs text-slate-500">
                            {[item.role, item.company].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-blue-500">
                      {starArray.slice(0, item.rating ?? 5).map((star) => (
                        <FontAwesomeIcon key={star} icon={faStar} className="h-3.5 w-3.5" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes testimonial-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .testimonial-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: testimonial-marquee 40s linear infinite;
        }
        .testimonial-group {
          display: flex;
          gap: 1.5rem;
        }
        .testimonial-card {
          flex-shrink: 0;
          width: 320px;
        }
        @media (min-width: 640px) {
          .testimonial-card {
            width: 360px;
          }
        }
        @media (min-width: 1024px) {
          .testimonial-card {
            width: 380px;
          }
        }
      `}</style>
    </section>
  );
}
