"use client";

import dynamic from "next/dynamic";

const SaunaMap = dynamic(() => import("@/components/SaunaMap"), {
  ssr: false,
  loading: () => <div className="map-container" style={{ background: "#0d0d0d" }} />,
});

export default function Home() {
  return (
    <main>
      <SaunaMap />
    </main>
  );
}
