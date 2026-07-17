import { Suspense, useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { PWAProvider } from "./components/PWAProvider";
import { SplashScreen } from "./components/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  // Set lang="en" on <html> so CSS `hyphens: auto` uses the English
  // hyphenation dictionary — required by all browsers for hyphens to work.
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <ErrorBoundary>
      <PWAProvider>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ style: { borderRadius: "14px", fontFamily: "inherit" } }}
        />
      </PWAProvider>
    </ErrorBoundary>
  );
}
