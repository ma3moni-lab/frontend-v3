import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { AdminLogin } from "./AdminLogin";
import { AdminApp } from "./AdminApp";
import { clearAdminTokens } from "../../lib/api";

export type AdminRole = "super-admin" | "admin" | "blog-admin" | "customer-care";
interface AdminSession { role: AdminRole; name: string; email: string; expiry: number; }
const ADMIN_KEY = "ma3moni_admin_session";

export function AdminRoot() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Omit<AdminSession, "expiry"> | null>(() => {
    try {
      const s = localStorage.getItem(ADMIN_KEY);
      if (s) { const p: AdminSession = JSON.parse(s); if (p.expiry > Date.now()) return { role: p.role, name: p.name, email: p.email }; }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (session) localStorage.setItem(ADMIN_KEY, JSON.stringify({ ...session, expiry: Date.now() + 8 * 60 * 60 * 1000 }));
    else localStorage.removeItem(ADMIN_KEY);
  }, [session]);

  return (
    <div className="size-full overflow-hidden">
      {!session
        ? <AdminLogin onLogin={s => setSession(s)} />
        : <AdminApp
            role={session.role}
            adminName={session.name}
            adminEmail={session.email}
            initialSection={section}
            onSectionChange={s => navigate(`/app/admin/${s}`, { replace: true })}
            onBack={() => { clearAdminTokens(); setSession(null); navigate("/app/admin", { replace: true }); }}
          />
      }
    </div>
  );
}
