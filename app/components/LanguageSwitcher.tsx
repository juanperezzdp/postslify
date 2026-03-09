"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { LanguageSwitcherProps } from "@/types/language-switcher";

export default function LanguageSwitcher({
  menuPlacement = "bottom",
}: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(
    () => [
      { value: "en", label: t("en") },
      { value: "es", label: t("es") },
    ],
    [t]
  );

  const selectedOption =
    options.find((option) => option.value === locale) ?? options[0];

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === locale)
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function commitSelection(nextLocale: string) {
    if (nextLocale === locale) {
      setIsOpen(false);
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale as "en" | "es" });
    });
    setIsOpen(false);
  }

  function openMenu() {
    setHighlightedIndex(selectedIndex);
    setIsOpen(true);
  }

  const menuPositionClass =
    menuPlacement === "top"
      ? "bottom-[calc(100%+12px)]"
      : "top-[calc(100%+12px)]";

  return (
    <div
      ref={containerRef}
      className="group relative z-10 inline-flex items-center justify-between gap-1 rounded-full  bg-blue-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90  ring-1 ring-white/10 transition hover:border-slate-900/25 "
    >
      <span className="flex items-center  text-white/80">
        <span className="text-[12px]">🌐</span>
        {t("label")}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isPending}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isOpen) {
              openMenu();
            } else {
              setHighlightedIndex((prev) =>
                Math.min(prev + 1, options.length - 1)
              );
            }
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
              openMenu();
            } else {
              setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            }
          }
          if (event.key === "Enter" && isOpen) {
            event.preventDefault();
            const option = options[highlightedIndex];
            if (option) {
              commitSelection(option.value);
            }
          }
        }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-[0_10px_20px_-14px_rgba(2,6,23,0.55)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_-16px_rgba(2,6,23,0.65)] focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
      >
        <span>{selectedOption.label}</span>
        <span className={`text-slate-800 transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
      </button>
      {isOpen && (
        <div
          className={`absolute ${menuPositionClass} right-0 z-50 min-w-[180px] rounded-2xl border border-slate-900/10 bg-white p-2 text-[11px] font-semibold uppercase tracking-wider text-slate-700 shadow-[0_28px_60px_-28px_rgba(2,6,23,0.65)] ring-1 ring-white/80 animate-fade-in-up`}
        >
          <div role="listbox" aria-activedescendant={`lang-${highlightedIndex}`}>
            {options.map((option, index) => {
              const isActive = option.value === locale;
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={option.value}
                  id={`lang-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commitSelection(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                    isActive
                      ? "bg-blue-500 text-white shadow-md"
                      : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-100/70"
                  }`}
                >
                  <span>{option.label}</span>
                  {isActive && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
