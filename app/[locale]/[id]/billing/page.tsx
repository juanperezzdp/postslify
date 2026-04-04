"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBuildingColumns, faCreditCard, faMobileScreenButton, faCircleCheck, faCircleXmark, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faAmazonPay, faApplePay, faCcAmex, faCcMastercard, faCcVisa, faGooglePay, faPaypal } from "@fortawesome/free-brands-svg-icons";
import type { BillingPlan, BillingPlanId, CreditsBalance, CreateOrderResponse, CreditTransactionSummary } from "@/types/billing";
import { useLocale, useTranslations } from "next-intl";

type BillingFormValues = {
  planId: BillingPlanId;
};

const PLANS: BillingPlan[] = [
  { id: "10", amountCents: 1000, label: "$10 USD" },
  { id: "25", amountCents: 2500, label: "$25 USD" },
  { id: "50", amountCents: 5000, label: "$50 USD" },
];

const PAYMENT_METHODS = [
  { label: "Visa", icon: faCcVisa },
  { label: "Mastercard", icon: faCcMastercard },
  { label: "Amex", icon: faCcAmex },
  { label: "PayPal", icon: faPaypal },
  { label: "Apple Pay", icon: faApplePay },
  { label: "Google Pay", icon: faGooglePay },
  { label: "Amazon Pay", icon: faAmazonPay },
  { label: "Card", icon: faCreditCard },
  { label: "Bank Transfer", icon: faBuildingColumns },
  { label: "Mobile Wallet", icon: faMobileScreenButton },
] as const;

export default function BillingPage() {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<BillingFormValues>({
    defaultValues: { planId: "10" },
  });

  const [balance, setBalance] = useState<CreditsBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [payments, setPayments] = useState<CreditTransactionSummary[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const handledPaymentIdRef = useRef<string | null>(null);
  const localeTag = locale === "es" ? "es-ES" : "en-US";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [localeTag]
  );

  const selectedPlanId = watch("planId");
  const selectedPlan = useMemo(() => {
    return PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[0];
  }, [selectedPlanId]);

  const loadBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const response = await fetch("/api/billing/credits", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(t("status.balanceError"));
      }
      const data = (await response.json()) as CreditsBalance;
      setBalance(data);
    } catch {
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [t]);

  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const response = await fetch("/api/billing/transactions", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(t("status.historyError"));
      }
      const data = (await response.json()) as { items: CreditTransactionSummary[] };
      setPayments(data.items || []);
    } catch {
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [t]);

  const handleCapture = useCallback(
    async (paymentId: string) => {
      setIsCapturing(true);
      setStatusMessage(null);
      setStatusType(null);

      try {
        const response = await fetch("/api/billing/dodo/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });

        const data = (await response.json()) as { success?: boolean; balanceCents?: number; error?: string };

        if (!response.ok || !data.success) {
          throw new Error(data.error || t("status.captureError"));
        }

        setStatusMessage(t("status.captureSuccess"));
        setStatusType("success");
        await loadBalance();
        await loadPayments();
      } catch (error) {
        console.error("Payment capture error:", error);
        setStatusMessage(t("status.captureError"));
        setStatusType("error");
      } finally {
        setIsCapturing(false);
      }
    },
    [loadBalance, loadPayments, t]
  );

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    const dodoStatus = searchParams.get("dodo");
    const paymentId = searchParams.get("payment_id");
    const externalStatus = searchParams.get("status");
    const cleanBillingPath = `/${locale}/${params?.id ?? ""}/billing`;

    if (dodoStatus === "cancel") {
      setStatusMessage(t("status.paymentCanceled"));
      setStatusType("error");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", cleanBillingPath);
      }
      return;
    }

    if (externalStatus === "failed") {
      setStatusMessage(t("status.paymentError"));
      setStatusType("error");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", cleanBillingPath);
      }
      return;
    }

    if (paymentId && !isCapturing) {
      if (handledPaymentIdRef.current === paymentId) {
        return;
      }
      handledPaymentIdRef.current = paymentId;
      void handleCapture(paymentId).finally(() => {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", cleanBillingPath);
        }
      });
    }
  }, [searchParams, isCapturing, handleCapture, locale, params?.id, t]);

  const onSubmit = async (values: BillingFormValues) => {
    setStatusMessage(null);
    setStatusType(null);

    try {
      const response = await fetch("/api/billing/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: values.planId, locale }),
      });

      const data = (await response.json()) as CreateOrderResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || t("status.orderError"));
      }

      window.location.href = data.approvalUrl;
    } catch (error) {
      console.error("Create checkout error:", error);
      setStatusMessage(t("status.orderError"));
      setStatusType("error");
    }
  };

  const balanceUsd = balance ? (balance.balanceCents / 100).toFixed(2) : "0.00";
  const requestCredits = balance ? Math.floor(balance.balanceCents / 3) : 0;

  if (isLoadingBalance || isLoadingPayments) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">{t("payment.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 font-sans">
      {statusMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-xl ring-1 backdrop-blur-sm ${
            statusType === "success" ? "bg-emerald-50/90 ring-emerald-200 text-emerald-800 shadow-emerald-500/10" :
            statusType === "error" ? "bg-red-50/90 ring-red-200 text-red-800 shadow-red-500/10" :
            "bg-amber-50/90 ring-amber-200 text-amber-800 shadow-amber-500/10"
          }`}>
            <span className="text-xl">
              {statusType === "success" ? (
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600" />
              ) : statusType === "error" ? (
                <FontAwesomeIcon icon={faCircleXmark} className="text-red-600" />
              ) : (
                <FontAwesomeIcon icon={faCircleExclamation} className="text-amber-600" />
              )}
            </span>
            <p className="font-bold">{statusMessage}</p>
          </div>
        </div>
      )}
      <main className="flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-10 sm:px-12 lg:px-16 lg:py-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:flex-row sm:items-center sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {t.rich("header.title", {
                highlight: (chunks) => (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">{chunks}</span>
                ),
              })}
            </h1>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500">
              {t("header.subtitle")}
            </p>
          </div>
          <Link
            href={`/${params?.id ?? ""}/create-post`}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95"
          >
            <span className="relative z-10">{t("header.back")}</span>
            <FontAwesomeIcon icon={faArrowRight} className="relative z-10 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t("balance.label")}</p>
              <p className="mt-1 text-4xl font-extrabold text-slate-900">
                {balanceUsd} <span className="text-lg text-slate-400 font-medium">{t("balance.currency")}</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
              <span className="text-xl">⚡</span>
              {t("balance.requests", { count: requestCredits })}
            </div>
          </div>
        </section>

        <section className="group rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-lg font-bold text-slate-900">{t("plans.title")}</p>
                <div className="grid gap-4">
                  {PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all duration-300 ease-out ${
                        selectedPlanId === plan.id
                          ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 scale-[1.02]"
                          : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md hover:scale-[1.01]"
                      }`}
                    >
                      <span className={`font-bold transition-colors ${
                        selectedPlanId === plan.id ? "text-blue-700" : "text-slate-600 group-hover:text-blue-600"
                      }`}>{plan.label}</span>
                      <div className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                        selectedPlanId === plan.id ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-transparent group-hover:border-blue-400"
                      }`}>
                         <div className={`h-2 w-2 rounded-full bg-white transition-transform ${selectedPlanId === plan.id ? "scale-100" : "scale-0"}`} />
                      </div>
                      <input
                        type="radio"
                        value={plan.id}
                        {...register("planId")}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-600">
                {t.rich("plans.selected", {
                  label: selectedPlan.label,
                  requests: (selectedPlan.amountCents / 3).toFixed(0),
                  strong: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                  highlight: (chunks) => <span className="text-blue-600 font-bold">{chunks}</span>,
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6 border-t border-slate-100 pt-8 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0 lg:w-full max-w-full overflow-hidden">
              <div className="flex  items-center justify-between gap-3 bg-black p-4 rounded-2xl text-white">
                <Image src="/logo-dodo.png" alt="Dodo Payments" width={70} height={70} className=" rounded-2xl " />
                <div className="text-lg font-bold text-white text-center sm:text-right">{t("payment.title")}</div>
              </div>
              
              <div className="relative overflow-hidden cursor-pointer bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full">
                <div className="relative mx-auto px-8 sm:px-4 flex w-full max-w-sm items-center justify-center py-2">
                  <div className="group relative h-36 w-full max-w-[260px]">
                    <Image
                      src="/Cart1.png"
                      alt="Card 1"
                      width={260}
                      height={160}
                      className="absolute left-[-10%] sm:left-0 top-5 w-32 sm:w-40 rounded-2xl transition-transform duration-500 ease-out group-hover:-rotate-3 group-hover:-translate-x-1"
                    />
                    <Image
                      src="/Cart2.png"
                      alt="Card 2"
                      width={260}
                      height={160}
                      className="absolute left-1/2 top-0 z-10 w-36 sm:w-44 -translate-x-1/2 rounded-2xl transition-transform duration-500 ease-out group-hover:-translate-y-1"
                      style={{ animationDelay: "220ms" }}
                    />
                    <Image
                      src="/Cart3.png"
                      alt="Card 3"
                      width={260}
                      height={160}
                      className="absolute right-[-10%] sm:right-0 top-6 w-32 sm:w-40 rounded-2xl transition-transform duration-500 ease-out group-hover:rotate-3 group-hover:translate-x-1"
                      style={{ animationDelay: "420ms" }}
                    />
                  </div>
                </div>
                <div className="payment-methods-marquee w-full max-w-full">
                <div className="payment-methods-marquee-content min-w-min">
                  {[...PAYMENT_METHODS, ...PAYMENT_METHODS].map((method, index) => (
                    <div
                      key={`row-${index}-${method.label}`}
                      className="hover:bg-blue-700 hover:text-blue-500 group-hover:bg-blue-500 group inline-flex h-9 w-fit shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-2 text-slate-700"
                      aria-label={method.label}
                      title={method.label}
                    >
                      <FontAwesomeIcon icon={method.icon} className="text-2xl text-slate-600  group-hover:text-white" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center px-2 mt-2 mb-4">
                  <p className="text-[15px] font-medium leading-relaxed text-slate-600">
                    {t.rich("payment.secureNote", {
                      strong: (chunks) => <span className="font-bold text-slate-900">{chunks}</span>,
                      highlight: (chunks) => <span className="font-bold text-blue-600">{chunks}</span>,
                    })}
                  </p>
                </div>
                  <button
                type="submit"
                disabled={isSubmitting || isCapturing}
                className="cursor-pointer  group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all duration-300 ease-out hover:bg-blue-700 hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span className="relative z-10">{isSubmitting || isCapturing ? t("payment.starting") : t("payment.dodoCta")}</span>
                {!isSubmitting && !isCapturing && <FontAwesomeIcon icon={faArrowRight} className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
              </button>
              </div>
              
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 transition-all sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 -rotate-45" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t("history.title")}</h2>
          </div>

          {isLoadingPayments ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <p className="font-bold text-slate-900">{t("history.emptyTitle")}</p>
              <p className="text-sm text-slate-500">{t("history.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map((p) => {
                const amountUsd = (p.amountCents / 100).toFixed(2);
                const isCompleted = p.status === "completed";
                const isRejected = p.status === "failed" || p.status === "canceled";
                const statusLabel = isCompleted
                  ? t("history.status.completed")
                  : isRejected
                  ? t("history.status.rejected")
                  : t("history.status.pending");
                
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isCompleted ? "bg-emerald-50 text-emerald-600" : isRejected ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        <span className="text-lg font-bold">$</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t("history.itemTitle", { provider: p.provider.toUpperCase() })}</p>
                        <p className="text-xs font-medium text-slate-500">
                          {p.createdAt ? dateFormatter.format(new Date(p.createdAt)) : t("history.unknownDate")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-4 sm:border-0 sm:pt-0">
                      <div className="flex flex-col items-end sm:items-end">
                        <span className="text-lg font-extrabold text-slate-900">${amountUsd}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : isRejected
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {statusMessage && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {statusMessage}
          </div>
        )}
      </main>
    </div>
  );
}
