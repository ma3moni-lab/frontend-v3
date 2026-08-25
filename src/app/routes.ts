import { createBrowserRouter } from "react-router";
import { lazy, type ComponentType } from "react";

// Eagerly load the user-facing root (most visited)
import { UserRoot } from "./components/UserRoot";
import { NotFound } from "./components/NotFound";

// Lazy import that reloads when the chunk 404s (stale hash after a new deploy)
function lazyWithRetry<T extends ComponentType>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    })
  );
}

// Lazy-load admin, blog, and reset-password — not needed on first paint for regular users
const AdminRoot         = lazyWithRetry(() => import("./components/AdminRoot").then(m => ({ default: m.AdminRoot })));
const BlogListPage      = lazyWithRetry(() => import("./components/BlogListPage").then(m => ({ default: m.BlogListPage })));
const ResetPasswordPage = lazyWithRetry(() => import("./components/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

// Named appRouter to avoid collision with any build-pipeline injected 'router' global
export const appRouter = createBrowserRouter([
  { path: "/",                    Component: UserRoot },
  { path: "/reset-password",      Component: ResetPasswordPage },
  { path: "/app/admin",           Component: AdminRoot },
  { path: "/app/admin/:section",  Component: AdminRoot },
  { path: "/blog",                Component: BlogListPage },
  { path: "*",                    Component: NotFound },
]);
