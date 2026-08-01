import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "統計ダッシュボード | サウナイッタ",
  description: "あなたのサウナ訪問履歴を月別訪問数・満足度分布・カレンダーでまとめたダッシュボードです。",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
