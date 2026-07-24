"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ServiceWorkerRegister } from "@/components/sauna-map/ServiceWorkerRegister";

function MapLoadingPlaceholder() {
  return (
    <div
      className="map-container"
      style={{
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        color: "#f0f5fc",
      }}
    >
      <Loader2 size={28} className="spin-icon" />
      <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>地図を読み込み中...</span>
    </div>
  );
}

const SaunaMap = dynamic(() => import("@/components/sauna-map/SaunaMap"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
});

export default function Home() {
  return (
    <main>
      <ServiceWorkerRegister />
      <SaunaMap />
    </main>
  );
}
