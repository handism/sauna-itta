"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DATA_SOURCE === "api") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/sauna-itta";
    const swUrl = `${basePath}/sw.js`;

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register(swUrl, { scope: `${basePath}/` })
        .catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker);
    return () => window.removeEventListener("load", registerServiceWorker);
  }, []);

  return null;
}
