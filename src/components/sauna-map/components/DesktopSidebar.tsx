"use client";

import { ChangeEvent, ReactNode, RefObject } from "react";
import Link from "next/link";
import {
  Flame,
  Sun,
  Moon,
  Camera,
  BarChart3,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useSaunaMap } from "../context/SaunaMapContext";

interface DesktopSidebarProps {
  isSidebarExpanded?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  mobileMenuRef?: RefObject<HTMLDivElement | null>;
  onToggleMobileMenu?: () => void;
  onCloseMobileMenu?: () => void;
  isAdding?: boolean;
  onStartNewVisit?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onOpenShareView?: () => void;
  onExportVisits?: () => void;
  importing?: boolean;
  importInputRef?: RefObject<HTMLInputElement | null>;
  onImportClick?: () => void;
  onImportChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}

export function DesktopSidebar(props: DesktopSidebarProps) {
  const context = useSaunaMap();

  const isSidebarExpanded = props.isSidebarExpanded ?? context.isSidebarExpanded;
  const onToggleSidebar = props.onToggleSidebar ?? context.toggleSidebar;
  const isMobileMenuOpen = props.isMobileMenuOpen ?? context.isMobileMenuOpen;
  const mobileMenuRef = props.mobileMenuRef ?? context.mobileMenuRef;
  const onToggleMobileMenu = props.onToggleMobileMenu ?? context.toggleMobileMenu;
  const onCloseMobileMenu = props.onCloseMobileMenu ?? context.closeMobileMenu;
  const isAdding = props.isAdding ?? context.isAdding;
  const onStartNewVisit = props.onStartNewVisit ?? context.startNewVisit;
  const theme = props.theme ?? context.theme;
  const onToggleTheme = props.onToggleTheme ?? context.toggleTheme;
  const onOpenShareView = props.onOpenShareView ?? context.openShareView;
  const onExportVisits = props.onExportVisits ?? context.exportVisits;
  const importing = props.importing ?? context.importing;
  const importInputRef = props.importInputRef ?? context.importInputRef;
  const onImportClick = props.onImportClick ?? (() => importInputRef.current?.click());
  const onImportChange = props.onImportChange ?? context.handleImportData;
  const children = props.children;

  return (
    <div className="ui-layer">
      {!isSidebarExpanded && (
        <button
          type="button"
          className="desktop-sidebar-open-btn"
          onClick={onToggleSidebar}
          aria-label="サイドバーを開く"
          title="サイドバーを開く"
        >
          <span className="open-btn-icon"><Flame size={18} /></span>
          <span className="open-btn-text">サウナイッタ</span>
          <span className="open-btn-arrow"><ChevronRight size={13} /></span>
        </button>
      )}

      {isMobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={onCloseMobileMenu}
          aria-hidden
        />
      )}
      <aside className={`sidebar ${!isSidebarExpanded ? "collapsed" : ""}`}>
        <button
          className="mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="パネルを開く・閉じる"
        >
          {isSidebarExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
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

        <div className="sidebar-content">{children}</div>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={onImportChange}
        />
      </aside>
    </div>
  );
}
