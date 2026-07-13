import { createBrowserRouter } from "react-router";
import { lazy } from "react";

// Eagerly load the user-facing root (most visited)
import { UserRoot } from "./components/UserRoot";
import { NotFound } from "./components/NotFound";

// Lazy-load admin and blog — not needed on first paint for regular users
const AdminRoot   = lazy(() => import("./components/AdminRoot").then(m => ({ default: m.AdminRoot })));
const BlogListPage= lazy(() => import("./components/BlogListPage").then(m => ({ default: m.BlogListPage })));

export const router = createBrowserRouter([
  { path: "/",      Component: UserRoot },
  { path: "/app/admin", Component: AdminRoot },
  { path: "/blog",  Component: BlogListPage },
  { path: "*",      Component: NotFound },
]);
