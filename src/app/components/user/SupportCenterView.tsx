import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, MessageSquare, Plus, Send, Clock, CheckCircle,
  AlertCircle, Shield, X, ChevronRight, Flag, ImagePlus,
  Info, Lock, ChevronDown, ChevronUp, FileText, Gavel,
} from "lucide-react";
import { moderation as moderationApi, type SupportTicket } from "../../../lib/api";
import { toast } from "sonner";

type Ticket = SupportTicket & { user?: { id: string; name: string; email: string } };

const READ_TICKETS_KEY = "ma3moni_read_tickets";

/** Persist which ticket+msgCount the user has opened so the banner knows when to clear. */
export function markTicketRead(ticketId: string, msgCount: number) {
  try {
    const raw = localStorage.getItem(READ_TICKETS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[ticketId] = msgCount;
    localStorage.setItem(READ_TICKETS_KEY, JSON.stringify(map));
  } catch {}
}

export function getUnreadTickets(tickets: Ticket[], myUserId: string): Ticket[] {
  let map: Record<string, number> = {};
  try { map = JSON.parse(localStorage.getItem(READ_TICKETS_KEY) ?? "{}"); } catch {}
  return tickets.filter(t => {
    if (t.status !== "in_progress" && t.status !== "escalated") return false;
    const msgs = t.messages ?? [];
    if (!msgs.length) return false;
    const lastMsg = msgs[msgs.length - 1];
    const isFromAdmin = myUserId ? lastMsg.sender.id !== myUserId : true;
    if (!isFromAdmin) return false;
    return (map[t.id] ?? 0) < msgs.length;
  });
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  open:        { bg: "#dbeafe", text: "#1d4ed8", label: "Open" },
  in_progress: { bg: "#e0e7ff", text: "#3730a3", label: "In Progress" },
  escalated:   { bg: "#fef9c3", text: "#854d0e", label: "Escalated" },
  resolved:    { bg: "#dcfce7", text: "#166534", label: "Resolved" },
  closed:      { bg: "#f3f4f6", text: "#6b7280", label: "Closed" },
};

const CATEGORY_LABEL: Record<string, string> = {
  general: "General Inquiry", account: "Account Issue", billing: "Billing & Subscription",
  photo_upload: "Photo Upload Problem", matching: "Matching & Suggestions",
  safety: "Safety Concern", appeal: "Appeal a Decision",
  suspension_appeal: "Suspension Appeal", other: "Other",
};

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

// ── Helpers ────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function EvidenceGrid({ images, onRemove }: { images: string[]; onRemove?: (i: number) => void }) {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((src, i) => (
        <div key={i} className="relative group">
          <img src={src} alt={`Evidence ${i + 1}`}
            className="w-20 h-20 rounded-xl object-cover border border-border cursor-pointer"
            onClick={() => window.open(src, "_blank")} />
          {onRemove && (
            <button onClick={() => onRemove(i)} aria-label="Remove"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ImageUploader({ images, onChange, max = 5, label = "Evidence photos" }: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    const remaining = max - images.length;
    const b64s = await Promise.all(files.slice(0, remaining).map(fileToBase64));
    onChange([...images, ...b64s].slice(0, max));
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{label}</span>
        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
          Optional · {images.length}/{max}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={i} className="relative group">
            <img src={src} alt={`Evidence ${i + 1}`}
              className="w-20 h-20 rounded-xl object-cover border border-border" />
            <button onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button onClick={() => ref.current?.click()} disabled={uploading}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
            aria-label="Add evidence">
            {uploading
              ? <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
              : <><ImagePlus size={18} className="text-muted-foreground" /><span className="text-muted-foreground" style={{ fontSize: "0.5625rem" }}>Add photo</span></>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="sr-only" onChange={pick} />
      <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.6875rem" }}>
        Screenshots help our team assess your case faster.
      </p>
    </div>
  );
}

// ── New Ticket / Appeal Modal ──────────────────────────────────
function NewTicketModal({ onClose, onCreated, prefillCategory }: {
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
  prefillCategory?: string;
}) {
  const isAppeal = prefillCategory === "appeal" || prefillCategory === "suspension_appeal";
  const [subject, setSubject]       = useState(isAppeal ? "Appeal — Account Action Review" : "");
  const [category, setCategory]     = useState(prefillCategory ?? "general");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence]     = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentIsAppeal = category === "appeal" || category === "suspension_appeal";

  const submit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await moderationApi.createTicket(
        subject, category, description,
        evidence.length ? evidence : undefined,
      );
      toast.success(currentIsAppeal
        ? "Appeal submitted — we'll review it within 3 business days."
        : "Ticket submitted. We'll be in touch shortly.");
      onCreated(ticket as Ticket);
    } catch {
      toast.error("Could not submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "94vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentIsAppeal ? "bg-amber-100" : "bg-primary/10"}`}>
              {currentIsAppeal ? <Gavel size={17} className="text-amber-600" /> : <MessageSquare size={17} className="text-primary" />}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                {currentIsAppeal ? "File an Appeal" : "New Support Ticket"}
              </h2>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                {currentIsAppeal ? "Reviews take 3 business days" : "Usually responded within 24 hours"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Appeal notice */}
          {currentIsAppeal && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div style={{ fontSize: "0.8125rem", color: "#92400e", lineHeight: 1.6 }}>
                <strong>What makes a strong appeal?</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>Explain clearly why the decision was incorrect</li>
                  <li>Provide any context or timeline of events</li>
                  <li>Attach screenshots or evidence if available</li>
                </ul>
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.9rem" }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "0.9rem" }} />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              {currentIsAppeal ? "Why was this decision incorrect?" : "Details"}
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
              placeholder={currentIsAppeal
                ? "Explain what happened, any relevant context, and the outcome you're requesting…"
                : "Describe your issue in as much detail as possible…"}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }} />
          </div>

          {/* Evidence — always visible for appeals, optional for others */}
          {currentIsAppeal && (
            <ImageUploader
              images={evidence}
              onChange={setEvidence}
              max={5}
              label="Supporting evidence (screenshots, photos)"
            />
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border bg-card flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
            style={{ fontSize: "0.9rem" }}>
            Cancel
          </button>
          <button onClick={submit}
            disabled={!subject.trim() || !description.trim() || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            style={{ fontSize: "0.9rem", fontWeight: 700 }}>
            {submitting
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : (currentIsAppeal ? <Gavel size={14} /> : <Send size={14} />)}
            {submitting ? "Submitting…" : currentIsAppeal ? "Submit Appeal" : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ticket Thread View ─────────────────────────────────────────
function TicketThreadView({ ticket: initial, onBack, onTicketRead }: {
  ticket: Ticket;
  onBack: () => void;
  onTicketRead?: (ticketId: string, msgCount: number) => void;
}) {
  const [ticket, setTicket] = useState<Ticket>(initial);
  const [reply, setReply]   = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const myUserId = (() => { try { return localStorage.getItem("ma3_uid") ?? ""; } catch { return ""; } })();

  // Load full thread on mount, then mark as read
  useEffect(() => {
    setLoading(true);
    moderationApi.ticketDetail(ticket.id)
      .then(t => {
        setTicket(t as Ticket);
        markTicketRead(t.id, t.messages.length);
        onTicketRead?.(t.id, t.messages.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [ticket.messages.length]);

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      // Append image descriptions if any (backend text field only)
      const fullBody = replyImages.length
        ? `${body}\n\n[Attached ${replyImages.length} image${replyImages.length > 1 ? "s" : ""}]`
        : body;
      await moderationApi.replyTicket(ticket.id, fullBody);
      setReply("");
      setReplyImages([]);
      const updated = await moderationApi.ticketDetail(ticket.id);
      setTicket(updated as Ticket);
      markTicketRead(updated.id, updated.messages.length);
    } catch {
      toast.error("Could not send — please try again.");
    } finally {
      setSending(false);
    }
  };

  const st = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open;
  const isAppealTicket = ticket.category === "appeal" || ticket.category === "suspension_appeal";
  const isClosed = ticket.status === "resolved" || ticket.status === "closed";
  const hasEvidence = (ticket.evidence ?? []).length > 0;

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }} className="truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
              {st.label}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
              {CATEGORY_LABEL[ticket.category] ?? ticket.category}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
              · {new Date(ticket.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata card — admin action summary if in_progress/escalated */}
      {(ticket.status === "in_progress" || ticket.status === "escalated") && (
        <div className="mx-3 mt-3 p-3.5 rounded-2xl border flex gap-3 flex-shrink-0"
          style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "#92400e" }}>
            <strong>Action required:</strong> Our support team has responded to this ticket. Please read the messages below and reply if needed.
          </div>
        </div>
      )}

      {/* Appeal notice */}
      {isAppealTicket && ticket.status === "open" && (
        <div className="mx-3 mt-3 p-3.5 rounded-2xl border flex gap-3 flex-shrink-0"
          style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "#1e40af" }}>
            Your appeal is being reviewed. We'll update this ticket within 3 business days.
          </p>
        </div>
      )}

      {/* Submitted evidence (collapsible) */}
      {hasEvidence && (
        <div className="mx-3 mt-3 border border-border rounded-2xl overflow-hidden flex-shrink-0">
          <button
            onClick={() => setShowEvidence(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card text-left">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText size={14} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Submitted evidence ({ticket.evidence.length} image{ticket.evidence.length !== 1 ? "s" : ""})
              </span>
            </div>
            {showEvidence ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          {showEvidence && (
            <div className="px-4 pb-4 border-t border-border">
              <EvidenceGrid images={ticket.evidence} />
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {loading && ticket.messages.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span style={{ fontSize: "0.875rem" }}>Loading messages…</span>
          </div>
        )}

        {ticket.messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
            <p style={{ fontSize: "0.875rem" }}>No messages yet — our team will respond soon.</p>
          </div>
        )}

        {ticket.messages.map((msg, i) => {
          const fromAdmin = myUserId ? msg.sender.id !== myUserId : true;
          return (
            <div key={i} className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}>
              {fromAdmin && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-1 border border-primary/20">
                  <Shield size={13} className="text-primary" />
                </div>
              )}
              <div className="max-w-[80%]">
                {fromAdmin && (
                  <p className="text-muted-foreground mb-1 ml-0.5" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Ma3moni Support
                  </p>
                )}
                <div className={`p-3.5 rounded-2xl ${fromAdmin
                  ? "bg-card border border-border rounded-tl-sm"
                  : "bg-primary text-white rounded-tr-sm"}`}
                  style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.body}</p>
                  <p className={`mt-1.5 ${fromAdmin ? "text-muted-foreground" : "opacity-55"}`} style={{ fontSize: "0.6875rem" }}>
                    {new Date(msg.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply area */}
      {isClosed ? (
        <div className="px-4 py-3.5 border-t border-border bg-muted/20 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Lock size={13} />
            <p style={{ fontSize: "0.8125rem" }}>
              This ticket is {ticket.status}.{" "}
              <button className="text-primary underline font-medium" onClick={onBack}>
                Open a new ticket
              </button>{" "}
              for further help.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border bg-card flex-shrink-0 space-y-2">
          {replyImages.length > 0 && (
            <div className="px-1">
              <EvidenceGrid images={replyImages} onRemove={i => setReplyImages(prev => prev.filter((_, j) => j !== i))} />
            </div>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1 flex items-end gap-1 px-4 py-2.5 rounded-2xl border border-border bg-input-background focus-within:ring-2 focus-within:ring-primary/25 transition-all">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder={isAppealTicket ? "Add more context to your appeal…" : "Reply to support…"}
                rows={1}
                className="flex-1 bg-transparent focus:outline-none resize-none"
                style={{ fontSize: "0.875rem", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
              />
              {isAppealTicket && replyImages.length < 3 && (
                <label className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer flex-shrink-0">
                  <ImagePlus size={15} />
                  <input type="file" accept="image/*" multiple className="sr-only"
                    onChange={async e => {
                      const files = Array.from(e.target.files ?? []).slice(0, 3 - replyImages.length);
                      e.target.value = "";
                      const b64s = await Promise.all(files.map(fileToBase64));
                      setReplyImages(prev => [...prev, ...b64s].slice(0, 3));
                    }} />
                </label>
              )}
            </div>
            <button onClick={sendReply} disabled={(!reply.trim() && !replyImages.length) || sending}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0">
              {sending
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Support Center ────────────────────────────────────────
interface SupportCenterViewProps {
  onBack: () => void;
  initialTicketId?: string;  // pre-open a specific ticket (e.g. from blocking banner)
  onTicketRead?: (ticketId: string, msgCount: number) => void;
}

export function SupportCenterView({ onBack, initialTicketId, onTicketRead }: SupportCenterViewProps) {
  const [tickets, setTickets]           = useState<Ticket[] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket]   = useState(false);
  const [newTicketCategory, setNewTicketCategory] = useState<string | undefined>();

  const myUserId = (() => { try { return localStorage.getItem("ma3_uid") ?? ""; } catch { return ""; } })();

  const fetchTickets = () => {
    moderationApi.myTickets().then(r => {
      const list = r.results as Ticket[];
      setTickets(list);
      // Auto-open pre-selected ticket once list loads
      if (initialTicketId && !selectedTicket) {
        const target = list.find(t => t.id === initialTicketId);
        if (target) setSelectedTicket(target);
      }
    }).catch(() => setTickets([]));
  };

  useEffect(fetchTickets, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNewTicket = (category?: string) => {
    setNewTicketCategory(category);
    setShowNewTicket(true);
  };

  if (selectedTicket) {
    return (
      <TicketThreadView
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onTicketRead={(id, count) => {
          onTicketRead?.(id, count);
          // Update the local ticket list's message count so the unread dot clears
          setTickets(prev => prev?.map(t => t.id === id ? { ...t, _readCount: count } as Ticket : t) ?? prev);
        }}
      />
    );
  }

  const openTickets   = tickets?.filter(t => t.status === "open" || t.status === "in_progress" || t.status === "escalated") ?? [];
  const closedTickets = tickets?.filter(t => t.status === "resolved" || t.status === "closed") ?? [];
  const unreadIds     = new Set(getUnreadTickets(tickets ?? [], myUserId).map(t => t.id));

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
          style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
          <Plus size={14} /> New Ticket
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Appeal CTA */}
        <button
          onClick={() => openNewTicket("appeal")}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Gavel size={18} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#92400e" }}>File an Appeal</p>
            <p style={{ fontSize: "0.8125rem", color: "#b45309", marginTop: 2 }}>
              Challenge a warning, suspension, or moderation decision
            </p>
          </div>
          <ChevronRight size={16} className="text-amber-600 flex-shrink-0" />
        </button>

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
                const st    = STATUS_STYLE[t.status] ?? STATUS_STYLE.open;
                const lastMsg = t.messages[t.messages.length - 1];
                const isUnread = unreadIds.has(t.id);
                return (
                  <button key={t.id} onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left rounded-2xl border p-4 hover:shadow-sm transition-all ${isUnread ? "border-primary/40 bg-primary/5" : "bg-card border-border hover:border-primary/20"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        <p style={{ fontWeight: 700, fontSize: "0.9rem" }} className="truncate">{t.subject}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                    {isUnread && (
                      <p className="text-primary mb-1.5" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        New message from support — tap to read
                      </p>
                    )}
                    {lastMsg && !isUnread && (
                      <p className="text-muted-foreground line-clamp-1 mb-1.5" style={{ fontSize: "0.8125rem" }}>
                        {lastMsg.body}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock size={11} />
                      <span style={{ fontSize: "0.75rem" }}>
                        {new Date(t.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      <span style={{ fontSize: "0.75rem" }}> · {t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</span>
                      {(t.evidence ?? []).length > 0 && (
                        <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}> · {t.evidence.length} evidence</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tickets !== null && openTickets.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <CheckCircle size={28} className="text-primary mx-auto mb-2 opacity-40" />
            <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>No open tickets</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
              Need help? Tap <strong>New Ticket</strong> or file an appeal using the button above.
            </p>
          </div>
        )}

        {/* Past tickets */}
        {tickets !== null && closedTickets.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Past Tickets
            </p>
            <div className="space-y-2">
              {closedTickets.map(t => {
                const st = STATUS_STYLE[t.status] ?? STATUS_STYLE.closed;
                return (
                  <button key={t.id} onClick={() => setSelectedTicket(t)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all opacity-70 hover:opacity-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }} className="flex-1 min-w-0 truncate">{t.subject}</p>
                      <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontSize: "0.625rem", fontWeight: 700, background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      {CATEGORY_LABEL[t.category] ?? t.category} · {new Date(t.updated_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{t.messages.length} message{t.messages.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
            Urgent safety concern? Email{" "}
            <a href="mailto:support@ma3moni.com" className="text-primary underline">support@ma3moni.com</a>
          </p>
        </div>
      </div>

      {showNewTicket && (
        <NewTicketModal
          prefillCategory={newTicketCategory}
          onClose={() => setShowNewTicket(false)}
          onCreated={ticket => {
            setShowNewTicket(false);
            setTickets(prev => prev ? [ticket, ...prev] : [ticket]);
            setSelectedTicket(ticket);
          }}
        />
      )}
    </div>
  );
}
