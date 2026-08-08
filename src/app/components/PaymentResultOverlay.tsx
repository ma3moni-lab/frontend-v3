import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, MessageCircle } from "lucide-react";
import { subscriptions as subsApi } from "../../lib/api";

type PayStatus = "pending" | "successful" | "failed" | "cancelled" | "refunded";

interface PaymentResult {
  reference: string;
  status: PayStatus;
  plan?: string;
  currency?: string;
  amount?: number;
  paid_at?: string;
  failure_reason?: string;
}

interface Props {
  reference: string;
  pendingPlan: string;
  onSuccess: (plan: string) => void;
  onClose: () => void;
}

const MAX_POLLS = 24;   // 24 × 5 s = 2 min max
const POLL_INTERVAL_MS = 5_000;

export function PaymentResultOverlay({ reference, pendingPlan, onSuccess, onClose }: Props) {
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [polls,  setPolls]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await subsApi.paymentStatus(reference);
      setResult(data);

      if (data.status === "successful") {
        onSuccess(data.plan ?? pendingPlan);
        return;
      }
      if (data.status === "pending") {
        setPolls(prev => {
          if (prev + 1 >= MAX_POLLS) return prev + 1;
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          return prev + 1;
        });
      }
      // failed / cancelled / refunded — stop polling, show error state
    } catch {
      setPolls(prev => {
        if (prev + 1 < MAX_POLLS) timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        return prev + 1;
      });
    }
  }, [reference, pendingPlan, onSuccess]);

  useEffect(() => {
    timerRef.current = setTimeout(poll, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [poll]);

  const isMidPoll = !result || (result.status === "pending" && polls < MAX_POLLS);
  const isTimeout = result?.status === "pending" && polls >= MAX_POLLS;
  const isFailed  = result?.status === "failed" || result?.status === "cancelled" || isTimeout;

  function fmtAmt(amount?: number, currency?: string) {
    if (!amount) return "";
    if (currency === "NGN") return ` · ₦${Number(amount).toLocaleString()}`;
    return ` · $${Number(amount).toFixed(2)}`;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header band */}
        <div
          className="h-2 w-full"
          style={{
            background: result?.status === "successful" ? "#0A6870"
              : isFailed ? "#dc2626"
              : "#f59e0b",
          }}
        />

        <div className="p-8 text-center space-y-4">
          {/* Icon */}
          {isMidPoll && !isTimeout ? (
            <div className="flex justify-center">
              <Loader2 size={56} className="animate-spin" style={{ color: "#0A6870" }} />
            </div>
          ) : result?.status === "successful" ? (
            <CheckCircle2 size={56} className="mx-auto text-teal-600" />
          ) : isFailed ? (
            <XCircle size={56} className="mx-auto text-red-500" />
          ) : (
            <Clock size={56} className="mx-auto text-amber-500" />
          )}

          {/* Headline */}
          <div>
            {isMidPoll && !isTimeout ? (
              <>
                <h2 className="font-extrabold text-xl">Confirming payment…</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Checking with Credo — this usually takes a few seconds.
                </p>
              </>
            ) : result?.status === "successful" ? (
              <>
                <h2 className="font-extrabold text-xl text-teal-700">Payment confirmed!</h2>
                <p className="text-gray-600 text-sm mt-1">
                  You're now on the <span className="font-bold capitalize">{result.plan ?? pendingPlan}</span> plan
                  {fmtAmt(result.amount, result.currency)}.
                </p>
              </>
            ) : isTimeout ? (
              <>
                <h2 className="font-extrabold text-xl text-amber-700">Still processing</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Your payment is being verified by Credo. It may take a few more minutes.
                  Check your email for confirmation, or contact support if this persists.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-extrabold text-xl text-red-600">Payment not completed</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {result?.failure_reason
                    ? result.failure_reason
                    : result?.status === "cancelled"
                    ? "The payment was cancelled before completion."
                    : "The payment could not be processed. No charge was made."}
                </p>
              </>
            )}
          </div>

          {/* Poll progress dots */}
          {isMidPoll && !isTimeout && (
            <div className="flex justify-center gap-1.5 mt-2">
              {Array.from({ length: Math.min(polls, 5) }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-teal-600/40" />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            {result?.status === "successful" ? (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-white font-bold transition-colors"
                style={{ background: "#0A6870" }}
              >
                Continue to app
              </button>
            ) : isFailed ? (
              <>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-white font-bold bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Try again
                </button>
                <a
                  href="mailto:support@ma3moni.com?subject=Payment%20issue"
                  className="w-full py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} /> Contact support
                </a>
              </>
            ) : isTimeout ? (
              <>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close and check later
                </button>
                <a
                  href="mailto:support@ma3moni.com?subject=Payment%20verification"
                  className="w-full py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} /> Contact support
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
