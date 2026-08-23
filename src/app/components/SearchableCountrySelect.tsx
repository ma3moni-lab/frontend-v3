import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface SearchableCountrySelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  inputClassName?: string;
}

export function SearchableCountrySelect({
  value,
  onChange,
  options,
  placeholder = "Select country…",
  inputClassName = "",
}: SearchableCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={open ? () => { setOpen(false); setQuery(""); } : handleOpen}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-left ${inputClassName}`}
        style={{ fontSize: "0.9375rem" }}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/40">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontSize: "0.875rem" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-muted-foreground text-center" style={{ fontSize: "0.875rem" }}>
                No matches
              </div>
            ) : (
              filtered.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => select(o)}
                  className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-primary/8 ${
                    value === o ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                  }`}
                  style={{ fontSize: "0.9rem" }}
                >
                  {o}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
