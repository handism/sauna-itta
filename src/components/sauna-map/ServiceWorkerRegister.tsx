"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/sauna-itta";
        const swUrl = `${basePath}/sw.js`;
        navigator.serviceWorker
          .register(swUrl, { scope: `${basePath}/` })
          .then((registration) => {
            console.log("ServiceWorker registration successful with scope: ", registration.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed: ", err);
          });
      });
    }
  }, []);

  return null;
}
