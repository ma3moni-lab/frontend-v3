import { createBrowserRouter } from "react-router";
import { lazy } from "react";

// Eagerly load the user-facing root (most visited)
import { UserRoot } from "./components/UserRoot";
import { NotFound } from "./components/NotFound";

// Lazy-load admin, blog, and reset-password — not needed on first paint for regular users
const AdminRoot         = lazy(() => import("./components/AdminRoot").then(m => ({ default: m.AdminRoot })));
const BlogListPage      = lazy(() => import("./components/BlogListPage").then(m => ({ default: m.BlogListPage })));
const ResetPasswordPage = lazy(() => import("./components/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

// Named appRouter to avoid collision with any build-pipeline injected 'router' global
export const appRouter = createBrowserRouter([
  { path: "/",                    Component: UserRoot },
  { path: "/reset-password",      Component: ResetPasswordPage },
  { path: "/app/admin",           Component: AdminRoot },
  { path: "/app/admin/:section",  Component: AdminRoot },
  { path: "/blog",                Component: BlogListPage },
  { path: "*",                    Component: NotFound },
]);
