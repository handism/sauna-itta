"use client";

import { RefObject } from "react";
import Link from "next/link";
import {
  Camera,
  BarChart3,
  Download,
  Upload,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";

export interface SidebarHeaderViewProps {
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  isAdding: boolean;
  onStartNewVisit: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenShareView: () => void;
  onExportVisits: () => void;
  importing: boolean;
  onImportClick: () => void;
}

export function SidebarHeaderView({
  isSidebarExpanded,
  onToggleSidebar,
  isMobileMenuOpen,
  mobileMenuRef,
  onToggleMobileMenu,
  onCloseMobileMenu,
  isAdding,
  onStartNewVisit,
  theme,
  onToggleTheme,
  onOpenShareView,
  onExportVisits,
  importing,
  onImportClick,
}: SidebarHeaderViewProps) {
  return (
    <div className="sidebar-header">
      <div className="sidebar-header-main">
        <h1 className="text-primary">サウナイッタ</h1>
        <p>マイととのいマップ</p>
      </div>
      <div className="mobile-menu-wrap" ref={mobileMenuRef}>
        <button
          type="button"
          className="desktop-sidebar-close-btn sidebar-action-btn"
          onClick={onToggleSidebar}
          aria-label="サイドバーを折りたたむ"
          title="サイドバーを折りたたむ"
        >
          <ChevronLeft size={18} />
        </button>
        {!isAdding && (
          <button
            type="button"
            className="mobile-menu-btn sidebar-action-btn"
            onClick={() => {
              onStartNewVisit();
              onCloseMobileMenu();
            }}
            aria-label="新規ピンを立てる"
            title="新規ピンを立てる"
          >
            <Plus size={18} />
          </button>
        )}
        <Link
          href="/stats"
          prefetch={false}
          className="mobile-menu-btn sidebar-action-btn"
          onClick={onCloseMobileMenu}
          aria-label="統計ダッシュボード"
          title="統計ダッシュボード"
        >
          <BarChart3 size={18} />
        </Link>
        <button
          type="button"
          className="mobile-menu-btn sidebar-action-btn"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          className="mobile-menu-btn sidebar-action-btn"
          onClick={onToggleMobileMenu}
          aria-label="メニュー"
          aria-expanded={isMobileMenuOpen}
        >
          <MoreHorizontal size={18} />
        </button>
        {isMobileMenuOpen && (
          <div
            className={`mobile-menu-dropdown ${
              isSidebarExpanded ? "mobile-menu-dropdown--down" : ""
            }`}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenShareView();
                onCloseMobileMenu();
              }}
            >
              <Camera size={15} /> シェア用ビュー
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onExportVisits();
                onCloseMobileMenu();
              }}
            >
              <Download size={15} /> エクスポート
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={importing}
              onClick={() => {
                onImportClick();
                onCloseMobileMenu();
              }}
            >
              {importing ? (
                <>
                  <Loader2 size={15} className="spin-icon" /> 取り込み中...
                </>
              ) : (
                <>
                  <Upload size={15} /> インポート
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
