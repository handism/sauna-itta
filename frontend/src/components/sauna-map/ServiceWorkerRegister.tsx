"use client";

import { useEffect } from "react";
import { BASE_PATH, DATA_SOURCE } from "../../../dataSource";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (DATA_SOURCE === "api") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const swUrl = `${BASE_PATH}/sw.js`;

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register(swUrl, { scope: `${BASE_PATH}/` })
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
