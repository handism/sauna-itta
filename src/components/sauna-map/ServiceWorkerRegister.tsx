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
            if (process.env.NODE_ENV !== "production") {
              console.debug(
                "ServiceWorker registration successful with scope: ",
                registration.scope,
              );
            }
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed: ", err);
          });
      });
    }
  }, []);

  return null;
}
