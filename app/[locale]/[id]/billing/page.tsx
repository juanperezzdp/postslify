"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { BillingPlan, BillingPlanId, CreditsBalance, CreateOrderResponse, CreditTransactionSummary } from "@/types/billing";
import type { PayPalNamespace } from "@/types/paypal-client";
import { useLocale, useTranslations } from "next-intl";

type BillingFormValues = {
  planId: BillingPlanId;
};

const PLANS: BillingPlan[] = [
  { id: "5", amountCents: 500, label: "$5 USD" },
  { id: "10", amountCents: 1000, label: "$10 USD" },
  { id: "25", amountCents: 2500, label: "$25 USD" },
  { id: "50", amountCents: 5000, label: "$50 USD" },
];

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
    defaultValues: { planId: "5" },
  });

  const [balance, setBalance] = useState<CreditsBalance | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPayPalReady, setIsPayPalReady] = useState(false);
  const [isRenderingButtons, setIsRenderingButtons] = useState(false);
  const [payments, setPayments] = useState<CreditTransactionSummary[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const paypalCardRef = useRef<HTMLDivElement | null>(null);
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
      const response = await fetch("/api/billing/credits", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(t("status.balanceError"));
      }
      const data = (await response.json()) as CreditsBalance;
      setBalance(data);
    } catch {
      setBalance(null);
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
    async (orderId: string) => {
      setIsCapturing(true);
      setStatusMessage(null);
      setStatusType(null);

      try {
        const response = await fetch("/api/billing/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
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
        const message = error instanceof Error ? error.message : t("status.captureError");
        setStatusMessage(message);
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
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setStatusMessage(t("status.missingClientId"));
      setStatusType("error");
      return;
    }

    const windowWithPayPal = window as Window & { paypal?: PayPalNamespace };
    if (windowWithPayPal.paypal) {
      setIsPayPalReady(true);
      return;
    }

    const existing = document.getElementById("paypal-js-sdk");
    if (existing) {
      existing.addEventListener("load", () => setIsPayPalReady(true));
      existing.addEventListener("error", () => {
        setStatusMessage(t("status.paypalLoadError"));
        setStatusType("error");
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-js-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons&enable-funding=card`;
    script.async = true;
    script.onload = () => setIsPayPalReady(true);
    script.onerror = () => {
      setStatusMessage(t("status.paypalLoadError"));
      setStatusType("error");
    };
    document.body.appendChild(script);
  }, [t]);

  useEffect(() => {
    const paypalStatus = searchParams.get("paypal");
    const token = searchParams.get("token");

    if (paypalStatus === "cancel") {
      setStatusMessage(t("status.paymentCanceled"));
      setStatusType("error");
      return;
    }

    if (token && !isCapturing) {
      handleCapture(token);
    }
  }, [searchParams, isCapturing, handleCapture]);

  const renderPayPalButtons = useCallback(async () => {
    if (!isPayPalReady || !paypalButtonsRef.current || !paypalCardRef.current) {
      return;
    }

    const windowWithPayPal = window as Window & { paypal?: PayPalNamespace };
    const paypal = windowWithPayPal.paypal;
    if (!paypal) {
      return;
    }

    paypalButtonsRef.current.innerHTML = "";
    paypalCardRef.current.innerHTML = "";
    setIsRenderingButtons(true);

    const createOrder = async () => {
      const response = await fetch("/api/billing/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      const data = (await response.json()) as CreateOrderResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("status.orderError"));
      }

      return data.orderId;
    };

    const onApprove = async (data: { orderID?: string }) => {
      if (!data.orderID) {
        throw new Error(t("status.orderMissingId"));
      }
      await handleCapture(data.orderID);
    };

    const onError = (error: unknown) => {
      const message = error instanceof Error ? error.message : t("status.paymentError");
      setStatusMessage(message);
      setStatusType("error");
    };

    await paypal
      .Buttons({
        fundingSource: paypal.FUNDING?.CARD,
        createOrder,
        onApprove,
        onError,
        style: {
          color: "black",
          shape: "pill",
          label: "pay",
          height: 48,
        },
      })
      .render(paypalCardRef.current);

    await paypal
      .Buttons({
        fundingSource: paypal.FUNDING?.PAYPAL,
        createOrder,
        onApprove,
        onError,
        style: {
          color: "blue",
          shape: "pill",
          label: "paypal",
          height: 48,
        },
      })
      .render(paypalButtonsRef.current);

    setIsRenderingButtons(false);
  }, [handleCapture, isPayPalReady, selectedPlanId, t]);

  useEffect(() => {
    if (!isPayPalReady) return;
    renderPayPalButtons();
  }, [isPayPalReady, renderPayPalButtons]);

  const onSubmit = async (values: BillingFormValues) => {
    setStatusMessage(null);
    setStatusType(null);

    try {
      const response = await fetch("/api/billing/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: values.planId }),
      });

      const data = (await response.json()) as CreateOrderResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || t("status.orderError"));
      }

      window.location.href = data.approvalUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : t("status.orderError");
      setStatusMessage(message);
      setStatusType("error");
    }
  };

  const balanceUsd = balance ? (balance.balanceCents / 100).toFixed(2) : "0.00";
  const requestCredits = balance ? Math.floor(balance.balanceCents / 3) : 0;

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 font-sans">
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

            <div className="flex flex-col gap-6 border-t border-slate-100 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <div className="text-lg font-bold text-slate-900">{t("payment.title")}</div>
              <div className="flex items-start gap-4 rounded-2xl bg-blue-50 p-5 text-blue-900 ring-1 ring-blue-100">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                   <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-blue-800">{t("payment.paypalTitle")}</p>
                  <p className="mt-1 font-medium text-blue-700/80 leading-relaxed">{t("payment.paypalSubtitle")}</p>
                </div>
              </div>
              {isPayPalReady ? (
                <div className="flex flex-col gap-4 relative z-0 isolate mt-2">
                  <div ref={paypalButtonsRef} className="paypal-zone" />
                  <div ref={paypalCardRef} className="paypal-zone" />
                  {isRenderingButtons && (
                    <div className="text-center text-sm font-medium text-slate-400 animate-pulse">
                      {t("payment.loading")}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isCapturing}
                  className="cursor-pointer mt-2 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-500 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="relative z-10">{isSubmitting ? t("payment.starting") : t("payment.paypalCta")}</span>
                  {!isSubmitting && <FontAwesomeIcon icon={faArrowRight} className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                </button>
              )}
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
                const isFailed = p.status === "failed" || p.status === "canceled";
                
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isCompleted ? "bg-emerald-50 text-emerald-600" : isFailed ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
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
                            : isFailed
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {isCompleted ? t("history.status.completed") : isFailed ? t("history.status.failed") : t("history.status.pending")}
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
