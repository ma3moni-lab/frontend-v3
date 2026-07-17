import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  blog as blogApi,
  type BlogArticle,
  type BlogCategory,
} from "../../../lib/api";
import {
  Plus, X, Eye, Pencil, Trash, Tag, Check,
  FileText, BookOpen, ImagePlus, ThumbsUp, Link,
} from "lucide-react";
import type { AdminRole } from "../AdminRoot";

// ─── Shared helpers ────────────────────────────────────────
type BodyBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "image"; src: string; caption: string; inputMode: "upload" | "url" };

const makeId = () => Math.random().toString(36).slice(2, 9);

// ─── TOP ARTICLES PANEL (dashboard widget) ─────────────────
export function TopArticlesPanel() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  useEffect(() => {
    blogApi.articles().then(r => setArticles(r.results.slice(0, 4))).catch(() => {});
  }, []);
  if (!articles.length) return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-4">Top Articles</h3>
      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>No articles published yet.</p>
    </div>
  );
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 style={{ fontWeight: 700, fontSize: "1rem" }} className="mb-4">Top Articles</h3>
      <div className="space-y-3">
        {articles.map((a, i) => (
          <div key={a.id} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--primary)" }}>#{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.35 }} className="line-clamp-1">{a.title}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{a.view_count.toLocaleString()} views · {a.likes_count} likes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BODY BLOCK EDITOR ────────────────────────────────────
function BodyBlockEditor({ block, onChange, onDelete, onAddAfter }: {
  block: BodyBlock;
  onChange: (b: BodyBlock) => void;
  onDelete: () => void;
  onAddAfter: (type: "paragraph" | "heading" | "image") => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || block.type !== "image") return;
    onChange({ ...block, src: URL.createObjectURL(file) });
  };

  return (
    <div className="group relative border border-border rounded-xl bg-card overflow-hidden">
      {block.type === "paragraph" && (
        <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
          rows={3} placeholder="Write paragraph text…"
          className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none"
          style={{ fontSize: "0.9rem", lineHeight: 1.7 }} />
      )}
      {block.type === "heading" && (
        <input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Section heading…"
          className="w-full px-4 py-3 bg-transparent focus:outline-none"
          style={{ fontSize: "1.0625rem", fontWeight: 700 }} />
      )}
      {block.type === "image" && (
        <div className="p-4 space-y-3">
          {block.src ? (
            <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
              <img src={block.src} alt={block.caption || "Article image"} className="w-full h-full object-cover" />
              <button onClick={() => onChange({ ...block, src: "" })}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Remove image">
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${block.inputMode === "upload" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
                onClick={() => onChange({ ...block, inputMode: "upload" })}>
                <ImagePlus size={22} className="text-primary" />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Upload image</span>
                <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </label>
              <div className={`flex-1 flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed transition-colors ${block.inputMode === "url" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
                onClick={() => onChange({ ...block, inputMode: "url" })}>
                <div className="flex items-center gap-2 text-primary">
                  <Link size={16} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Image URL</span>
                </div>
                <input type="url" value={block.src} onChange={e => onChange({ ...block, src: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: "0.8rem" }} onClick={e => e.stopPropagation()} />
              </div>
            </div>
          )}
          <input value={block.caption} onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: "0.8rem" }} />
        </div>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground" style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" }}>{block.type}</span>
        <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors" aria-label="Delete block">
          <Trash size={12} className="text-red-500" />
        </button>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 pb-3 pt-0">
        <div className="relative inline-block">
          <button onClick={() => setShowAddMenu(s => !s)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            <Plus size={13} /> Add block
          </button>
          {showAddMenu && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[160px]">
              {(["paragraph", "heading", "image"] as const).map(t => (
                <button key={t} onClick={() => { onAddAfter(t); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                  style={{ fontSize: "0.8125rem" }}>
                  {t === "paragraph" ? <FileText size={13} /> : t === "heading" ? <BookOpen size={13} /> : <ImagePlus size={13} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BLOG EDITOR MODAL ────────────────────────────────────
export function BlogEditorModal({ article, categories, onClose, onSaved }: {
  article: BlogArticle | null;
  categories: BlogCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!article;

  const initBlocks = (): BodyBlock[] => {
    if (!article?.content) return [{ id: makeId(), type: "paragraph", text: "" }];
    try {
      const parsed = JSON.parse(article.content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b: { type: string; text?: string; src?: string; caption?: string }) => ({
          id: makeId(), ...b,
          ...(b.type === "image" ? { inputMode: "url" as const } : {}),
        })) as BodyBlock[];
      }
    } catch {}
    return [{ id: makeId(), type: "paragraph", text: article.content }];
  };

  const [form, setForm] = useState({
    title:          article?.title      ?? "",
    categoryId:     article?.category?.id ?? (categories[0]?.id ?? ""),
    excerpt:        article?.excerpt    ?? "",
    coverImage:     article?.cover_image ?? "",
    coverInputMode: "upload" as "upload" | "url",
    status:         (article?.status ?? "draft") as "draft" | "published",
  });
  const [blocks,    setBlocks]    = useState<BodyBlock[]>(initBlocks);
  const [saving,    setSaving]    = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const u = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); u("coverImage", URL.createObjectURL(file)); }
  };

  const updateBlock = (id: string, updated: BodyBlock) =>
    setBlocks(prev => prev.map(b => b.id === id ? updated : b));
  const deleteBlock = (id: string) =>
    setBlocks(prev => prev.filter(b => b.id !== id));
  const addAfter = (afterId: string, type: "paragraph" | "heading" | "image") => {
    const idx = blocks.findIndex(b => b.id === afterId);
    const nb: BodyBlock = type === "image"
      ? { id: makeId(), type: "image", src: "", caption: "", inputMode: "upload" }
      : { id: makeId(), type, text: "" };
    setBlocks(prev => [...prev.slice(0, idx + 1), nb, ...prev.slice(idx + 1)]);
  };

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim()) { toast.error("Please enter an article title."); return; }
    setSaving(true);
    try {
      const contentJson = JSON.stringify(
        blocks.map(b => {
          const { id: _id, ...withoutId } = b;
          if ("inputMode" in withoutId) {
            const { inputMode: _m, ...withoutMode } = withoutId as typeof withoutId & { inputMode: unknown };
            return withoutMode;
          }
          return withoutId;
        })
      );
      let saved: BlogArticle;
      if (isEdit && article) {
        saved = await blogApi.updateArticle(article.id, {
          title: form.title, excerpt: form.excerpt, content: contentJson,
          category_id: form.categoryId || undefined,
          status: publish ? "published" : form.status,
        });
      } else {
        saved = await blogApi.createArticle({
          title: form.title, excerpt: form.excerpt, content: contentJson,
          category_id: form.categoryId || undefined,
          status: publish ? "published" : "draft",
        });
      }
      if (coverFile) await blogApi.uploadCover(saved.id, coverFile).catch(() => {});
      if (publish && !isEdit) await blogApi.publishArticle(saved.id).catch(() => {});
      toast.success(publish ? `"${form.title}" published!` : `"${form.title}" saved as draft.`);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save article: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{isEdit ? "Edit Article" : "New Article"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Cover image */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Cover Image</label>
            {form.coverImage ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white cursor-pointer hover:bg-white/30 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    <ImagePlus size={15} /> Replace
                    <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
                  </label>
                  <button onClick={() => u("coverImage", "")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/80 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    <Trash size={15} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
                <div className="flex border-b border-border">
                  {(["upload", "url"] as const).map(mode => (
                    <button key={mode} onClick={() => u("coverInputMode", mode)}
                      className={`flex-1 py-2.5 text-center transition-colors ${form.coverInputMode === mode ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {mode === "upload" ? "Upload file" : "Paste URL"}
                    </button>
                  ))}
                </div>
                {form.coverInputMode === "upload" ? (
                  <label className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer hover:bg-muted/40 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ImagePlus size={22} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Click to upload cover image</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>JPG, PNG, WEBP — recommended 1200×600px</p>
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
                  </label>
                ) : (
                  <div className="p-4">
                    <input type="url" value={form.coverImage} onChange={e => u("coverImage", e.target.value)}
                      placeholder="https://images.unsplash.com/…"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      style={{ fontSize: "0.9rem" }} />
                    {form.coverImage && <img src={form.coverImage} alt="Preview" className="mt-3 w-full rounded-xl object-cover" style={{ height: 120 }} />}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Title</label>
            <input value={form.title} onChange={e => u("title", e.target.value)} placeholder="Article headline…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: "1rem", fontWeight: 600 }} />
          </div>
          {/* Excerpt */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Excerpt</label>
            <textarea value={form.excerpt} onChange={e => u("excerpt", e.target.value)} rows={2}
              placeholder="Brief summary shown on the listing page…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ fontSize: "0.9rem" }} />
          </div>
          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Category</label>
              <select value={form.categoryId} onChange={e => u("categoryId", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.9rem" }}>
                <option value="">— No category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={e => u("status", e.target.value as "draft" | "published")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "0.9rem" }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Body blocks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Article Body</label>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {blocks.map(block => (
                <BodyBlockEditor key={block.id} block={block}
                  onChange={updated => updateBlock(block.id, updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onAddAfter={type => addAfter(block.id, type)} />
              ))}
              {blocks.length === 0 && (
                <div className="flex gap-2">
                  {(["paragraph", "heading", "image"] as const).map(t => (
                    <button key={t} onClick={() => setBlocks([
                      t === "image"
                        ? { id: makeId(), type: "image", src: "", caption: "", inputMode: "upload" }
                        : { id: makeId(), type: t, text: "" }
                    ])}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground"
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                      {t === "image" ? <ImagePlus size={14} /> : t === "heading" ? <BookOpen size={14} /> : <FileText size={14} />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button onClick={onClose} disabled={saving}
              className="px-5 py-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
              style={{ fontSize: "0.9rem" }}>Cancel</button>
            {!isEdit && (
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
                style={{ fontSize: "0.9rem" }}>
                {saving ? "Saving…" : "Save Draft"}
              </button>
            )}
            <button onClick={() => handleSave(form.status === "published" || isEdit ? false : true)} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLOG SECTION ─────────────────────────────────────────
export function BlogSection({ role }: { role: AdminRole }) {
  const canEdit = role === "super-admin" || role === "admin" || role === "blog-admin";
  const [tab, setTab] = useState<"articles" | "categories">("articles");

  const [articles,    setArticles]    = useState<BlogArticle[]>([]);
  const [artLoading,  setArtLoading]  = useState(true);
  const [editingArt,  setEditingArt]  = useState<BlogArticle | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [preview,     setPreview]     = useState<BlogArticle | null>(null);
  const [deletingArt, setDeletingArt] = useState<string | null>(null);

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [newCat,     setNewCat]     = useState("");
  const [catSaving,  setCatSaving]  = useState(false);
  const [editCatId,  setEditCatId]  = useState<string | null>(null);
  const [editCatVal, setEditCatVal] = useState("");

  const reload = () => {
    setArtLoading(true);
    Promise.all([
      blogApi.articles().then(r => setArticles(r.results)),
      blogApi.categories().then(setCategories),
    ]).finally(() => setArtLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setCatSaving(true);
    try {
      const cat = await blogApi.createCategory(name);
      setCategories(prev => [...prev, cat]);
      setNewCat("");
      toast.success(`Category "${cat.name}" created.`);
    } catch { toast.error("Failed to create category."); }
    finally { setCatSaving(false); }
  };

  const saveEditCat = async (id: string) => {
    const name = editCatVal.trim();
    if (!name) { setEditCatId(null); return; }
    try {
      const updated = await blogApi.updateCategory(id, name);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      toast.success(`Category renamed to "${updated.name}".`);
    } catch { toast.error("Failed to rename category."); }
    setEditCatId(null);
  };

  const deleteCategory = async (id: string, name: string) => {
    const count = articles.filter(a => a.category?.id === id).length;
    if (count > 0) { toast.error(`"${name}" is used by ${count} article(s). Reassign them first.`); return; }
    try {
      await blogApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(`Category "${name}" deleted.`);
    } catch { toast.error("Failed to delete category."); }
  };

  const deleteArticle = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingArt(id);
    try {
      await blogApi.deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success("Article deleted.");
    } catch { toast.error("Failed to delete article."); }
    finally { setDeletingArt(null); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      published: { bg: "#d1fae5", color: "#065f46" },
      draft:     { bg: "#fef3c7", color: "#92400e" },
      archived:  { bg: "#f3f4f6", color: "#6b7280" },
    };
    const s = map[status] ?? map.draft;
    return <span className="px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: s.bg, color: s.color }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Blog Management</h2>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.875rem" }}>Create articles, manage categories and track reader engagement</p>
        </div>
        {canEdit && tab === "articles" && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            <Plus size={14} /> New Article
          </button>
        )}
        {canEdit && tab === "categories" && (
          <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{categories.length} categories</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Articles", value: articles.length, icon: <FileText size={16} /> },
          { label: "Published",      value: articles.filter(a => a.status === "published").length, icon: <Eye size={16} /> },
          { label: "Total Likes",    value: articles.reduce((s, a) => s + (a.likes_count ?? 0), 0).toLocaleString(), icon: <ThumbsUp size={16} /> },
          { label: "Categories",     value: categories.length, icon: <Tag size={16} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.375rem", lineHeight: 1.1, color: "var(--primary)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5 w-fit">
        {(["articles", "categories"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg transition-all capitalize ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            style={{ fontSize: "0.875rem", fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      {/* Articles table */}
      {tab === "articles" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {artLoading ? (
            <div className="p-8 flex items-center justify-center text-muted-foreground" style={{ fontSize: "0.9rem" }}>Loading articles…</div>
          ) : articles.length === 0 ? (
            <div className="p-10 text-center">
              <FileText size={32} className="text-muted-foreground mx-auto mb-3" />
              <p style={{ fontWeight: 600, fontSize: "1rem" }}>No articles yet</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>Create your first article to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    {["Cover", "Title", "Category", "Author", "Views", "Likes", "Status", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map(a => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {a.cover_image
                            ? <img src={a.cover_image} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><FileText size={14} className="text-muted-foreground" /></div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", maxWidth: 220 }} className="line-clamp-1">{a.title}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                          {a.published_at ? new Date(a.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {a.category
                          ? <span className="px-2.5 py-1 rounded-full text-primary bg-secondary" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{a.category.name}</span>
                          : <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{a.author?.full_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1"><Eye size={12} className="text-muted-foreground" /><span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{(a.view_count ?? 0).toLocaleString()}</span></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1"><ThumbsUp size={12} className="text-green-500" /><span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#16a34a" }}>{a.likes_count ?? 0}</span></div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreview(a)} className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors" style={{ fontSize: "0.8125rem" }}>
                            <Eye size={13} /> Preview
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => setEditingArt(a)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.8125rem" }}>
                                <Pencil size={13} /> Edit
                              </button>
                              <button onClick={() => deleteArticle(a.id, a.title)} disabled={deletingArt === a.id}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40" style={{ fontSize: "0.8125rem" }}>
                                <Trash size={13} /> {deletingArt === a.id ? "…" : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Categories manager */}
      {tab === "categories" && (
        <div className="space-y-4">
          {canEdit && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>Add New Category</p>
              <div className="flex gap-2">
                <input value={newCat} onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                  placeholder="Category name…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: "0.9rem" }} />
                <button type="button" onClick={addCategory} disabled={!newCat.trim() || catSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  <Plus size={14} /> {catSaving ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>All Categories</p>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{categories.length} total</span>
            </div>
            {categories.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground" style={{ fontSize: "0.875rem" }}>No categories yet. Add one above.</div>
            )}
            {categories.map(cat => {
              const count = articles.filter(a => a.category?.id === cat.id).length;
              const isEditingCat = editCatId === cat.id;
              return (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditingCat ? (
                      <input value={editCatVal} onChange={e => setEditCatVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditCat(cat.id); if (e.key === "Escape") setEditCatId(null); }}
                        autoFocus
                        className="w-full px-3 py-1.5 rounded-lg border border-primary bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ fontSize: "0.9rem", fontWeight: 600 }} />
                    ) : (
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{cat.name}</p>
                    )}
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{count} article{count !== 1 ? "s" : ""}</p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      {isEditingCat ? (
                        <>
                          <button onClick={() => saveEditCat(cat.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            style={{ fontSize: "0.8125rem", fontWeight: 600 }}><Check size={12} /> Save</button>
                          <button onClick={() => setEditCatId(null)}
                            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                            style={{ fontSize: "0.8125rem" }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditCatId(cat.id); setEditCatVal(cat.name); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                            style={{ fontSize: "0.8125rem" }}><Pencil size={13} /> Edit</button>
                          <button onClick={() => deleteCategory(cat.id, cat.name)} disabled={count > 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ fontSize: "0.8125rem" }} title={count > 0 ? "Reassign articles before deleting" : "Delete category"}>
                            <Trash size={13} /> Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Article quick-preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl my-6 overflow-hidden">
            {preview.cover_image && <img src={preview.cover_image} alt="Cover" className="w-full h-48 object-cover" />}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{preview.category?.name ?? "—"}</span>
                <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.2 }} className="mb-2">{preview.title}</h2>
              <p className="text-muted-foreground mb-4" style={{ fontSize: "0.9375rem" }}>{preview.excerpt || "No excerpt."}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "var(--primary)" }}>
                    {(preview.author?.full_name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{preview.author?.full_name ?? "Unknown"}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    {preview.published_at ? new Date(preview.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  <span className="flex items-center gap-1"><Eye size={13} />{(preview.view_count ?? 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={13} />{preview.likes_count ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showCreate || editingArt !== null) && (
        <BlogEditorModal
          article={editingArt}
          categories={categories}
          onClose={() => { setShowCreate(false); setEditingArt(null); }}
          onSaved={() => { setShowCreate(false); setEditingArt(null); reload(); }}
        />
      )}
    </div>
  );
}
