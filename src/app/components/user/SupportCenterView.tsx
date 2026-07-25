import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, MessageSquare, Plus, Send, Clock, CheckCircle,
  AlertCircle, Shield, X, ChevronRight, Flag,
} from "lucide-react";
import { moderation as moderationApi, type SupportTicket } from "../../../lib/api";
import { toast } from "sonner";

// The backend returns user info alongside each ticket — use it to identify
// which messages are from the user vs. from support staff.
type TicketWithUser = SupportTicket & { user?: { id: string; name: string; email: string } };

interface SupportCenterViewProps {
  onBack: () => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  open:        { bg: "#dbeafe", text: "#1d4ed8", label: "Open" },
  in_progress: { bg: "#e0e7ff", text: "#3730a3", label: "In Progress" },
  escalated:   { bg: "#fef9c3", text: "#854d0e", label: "Escalated" },
  resolved:    { bg: "#dcfce7", text: "#166534", label: "Resolved" },
  closed:      { bg: "#f3f4f6", text: "#6b7280", label: "Closed" },
};

const CATEGORIES = [
  { value: "general",         label: "General Inquiry" },
  { value: "account",         label: "Account Issue" },
  { value: "billing",         label: "Billing & Subscription" },
  { value: "photo_upload",    label: "Photo Upload Problem" },
  { value: "matching",        label: "Matching & Suggestions" },
  { value: "safety",          label: "Safety Concern" },
  { value: "appeal",          label: "Appeal a Decision" },
  { value: "other",           label: "Other" },
];

function NewTicketModal({ onClose, onCreated, prefillCategory }: {
  onClose: () => void;
  onCreated: (ticket: SupportTicket) => void;
  prefillCategory?: string;
}) {
  const [subject, setSubject] = useState(prefillCategory === "appeal" ? "Appeal — Account Action Review" : "");
  const [category, setCategory] = useState(prefillCategory ?? "general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await moderationApi.createTicket(subject, category, description);
      toast.success("Support ticket submitted. We'll be in touch shortly.");
      onCreated(ticket);
    } catch {
      toast.error("Could not submit ticket — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
              {category === "appeal" ? "File an Appeal" : "New Support Ticket"}
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              {category === "appeal"
                ? "Challenge a moderation decision or account action"
                : "Our team usually responds within 24 hours"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {category === "appeal" && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p style={{ fontSize: "0.8125rem", color: "#92400e", lineHeight: 1.55 }}>
                Appeals are reviewed within 3 business days. Provide as much detail as possible about why you believe the decision was incorrect.
              </p>
            </div>
          )}

          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.9rem" }}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              {category === "appeal" ? "Why do you believe this decision was incorrect?" : "Details"}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder={
                category === "appeal"
                  ? "Explain what happened, provide any relevant context, and describe the outcome you are requesting…"
                  : "Describe your issue in as much detail as possible…"
              }
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }}
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border bg-card flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted" style={{ fontSize: "0.9rem" }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!subject.trim() || !description.trim() || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            style={{ fontSize: "0.9rem", fontWeight: 700 }}
          >
            {submitting
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Send size={14} />}
            {submitting ? "Submitting…" : category === "appeal" ? "Submit Appeal" : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketThreadView({ ticket: initial, onBack }: { ticket: TicketWithUser; onBack: () => void }) {
  const [ticket, setTicket] = useState<TicketWithUser>(initial);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Refresh full thread on mount
  useEffect(() => {
    setLoading(true);
    moderationApi.ticketDetail(ticket.id).then(setTicket).catch(() => {}).finally(() => setLoading(false));
  }, [ticket.id]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [ticket.messages.length]);

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await moderationApi.replyTicket(ticket.id, body);
      setReply("");
      // Re-fetch thread to show the reply
      const updated = await moderationApi.ticketDetail(ticket.id);
      setTicket(updated);
    } catch {
      toast.error("Could not send — please try again.");
    } finally {
      setSending(false);
    }
  };

  const st = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
              {st.label}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
              {new Date(ticket.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && ticket.messages.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span style={{ fontSize: "0.875rem" }}>Loading messages…</span>
          </div>
        )}

        {ticket.messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
            <p style={{ fontSize: "0.875rem" }}>No messages yet. Our team will respond soon.</p>
          </div>
        )}

        {ticket.messages.map((msg, i) => {
          // The backend returns ticket.user.id — use it to identify the user's own messages.
          // Fall back to name matching if user ID is unavailable.
          const ticketUserId = ticket.user?.id;
          const fromAdmin = ticketUserId
            ? msg.sender.id !== ticketUserId
            : Boolean(msg.sender.full_name?.toLowerCase().match(/support|admin|care|ma3moni/));
          return (
            <div key={i} className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}>
              {fromAdmin && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <Shield size={12} className="text-primary" />
                </div>
              )}
              <div
                className={`max-w-[78%] p-3 rounded-xl ${fromAdmin ? "bg-card border border-border rounded-bl-sm" : "bg-primary text-white rounded-br-sm"}`}
                style={{ fontSize: "0.875rem", lineHeight: 1.55 }}
              >
                {fromAdmin && (
                  <p className="text-muted-foreground mb-1" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                    Ma3moni Support
                  </p>
                )}
                <p>{msg.body}</p>
                <p className={`mt-1 ${fromAdmin ? "text-muted-foreground" : "opacity-60"}`} style={{ fontSize: "0.7rem" }}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input — disabled for resolved/closed */}
      {(ticket.status === "resolved" || ticket.status === "closed") ? (
        <div className="px-4 py-3 border-t border-border bg-muted/30 text-center flex-shrink-0">
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            This ticket is {ticket.status}. <button className="text-primary underline" onClick={() => {}}>Open a new ticket</button> for further help.
          </p>
        </div>
      ) : (
        <div className="p-3 border-t border-border bg-card flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder="Reply to support…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.875rem" }}
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {sending
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SupportCenterView({ onBack }: SupportCenterViewProps) {
  const [tickets, setTickets] = useState<TicketWithUser[] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketCategory, setNewTicketCategory] = useState<string | undefined>();

  const fetchTickets = () => {
    moderationApi.myTickets().then(r => setTickets(r.results as TicketWithUser[])).catch(() => setTickets([]));
  };

  useEffect(fetchTickets, []);

  const openNewTicket = (category?: string) => {
    setNewTicketCategory(category);
    setShowNewTicket(true);
  };

  if (selectedTicket) {
    return (
      <TicketThreadView
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  const openTickets = tickets?.filter(t => t.status === "open" || t.status === "in_progress" || t.status === "escalated") ?? [];
  const closedTickets = tickets?.filter(t => t.status === "resolved" || t.status === "closed") ?? [];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Support & Appeals</h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
              {tickets === null ? "Loading…" : `${openTickets.length} active · ${closedTickets.length} resolved`}
            </p>
          </div>
        </div>
        <button
          onClick={() => openNewTicket()}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          style={{ fontSize: "0.8125rem", fontWeight: 600 }}
        >
          <Plus size={14} /> New Ticket
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Appeal CTA */}
        <div
          onClick={() => openNewTicket("appeal")}
          className="cursor-pointer p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 hover:bg-amber-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Flag size={18} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#92400e" }}>File an Appeal</p>
            <p style={{ fontSize: "0.8125rem", color: "#b45309", marginTop: 2 }}>
              Challenge a warning, suspension, or other account action
            </p>
          </div>
          <ChevronRight size={16} className="text-amber-600 flex-shrink-0" />
        </div>

        {/* Loading */}
        {tickets === null && (
          <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span style={{ fontSize: "0.9rem" }}>Loading tickets…</span>
          </div>
        )}

        {/* Active tickets */}
        {tickets !== null && openTickets.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Tickets
            </p>
            <div className="space-y-2">
              {openTickets.map(t => {
                const st = STATUS_STYLE[t.status] ?? STATUS_STYLE.open;
                const lastMsg = t.messages[t.messages.length - 1];
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p style={{ fontWeight: 700, fontSize: "0.9rem" }} className="flex-1 min-w-0 truncate">{t.subject}</p>
                      <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                    {lastMsg && (
                      <p className="text-muted-foreground line-clamp-1 mb-2" style={{ fontSize: "0.8125rem" }}>
                        {lastMsg.body}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock size={11} />
                      <span style={{ fontSize: "0.75rem" }}>
                        {new Date(t.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      <span style={{ fontSize: "0.75rem" }}> · {t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty active state */}
        {tickets !== null && openTickets.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <CheckCircle size={28} className="text-primary mx-auto mb-2 opacity-40" />
            <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>No open tickets</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
              Need help? Tap <strong>New Ticket</strong> or use the appeal button above.
            </p>
          </div>
        )}

        {/* Resolved/closed tickets */}
        {tickets !== null && closedTickets.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Past Tickets
            </p>
            <div className="space-y-2">
              {closedTickets.map(t => {
                const st = STATUS_STYLE[t.status] ?? STATUS_STYLE.closed;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all opacity-70 hover:opacity-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }} className="flex-1 min-w-0 truncate">{t.subject}</p>
                      <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>
                      {new Date(t.updated_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{t.messages.length} message{t.messages.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
            For urgent safety concerns, email{" "}
            <a href="mailto:support@ma3moni.com" className="text-primary underline">support@ma3moni.com</a>
          </p>
        </div>
      </div>

      {showNewTicket && (
        <NewTicketModal
          prefillCategory={newTicketCategory}
          onClose={() => setShowNewTicket(false)}
          onCreated={ticket => {
            const t = ticket as TicketWithUser;
            setShowNewTicket(false);
            setTickets(prev => prev ? [t, ...prev] : [t]);
            setSelectedTicket(t);
          }}
        />
      )}
    </div>
  );
}
