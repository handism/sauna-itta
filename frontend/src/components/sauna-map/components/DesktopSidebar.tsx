"use client";

import { ChangeEvent, ReactNode, RefObject } from "react";
import {
  Flame,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  useSaunaUI,
  useVisitsStatus,
  useVisitsActions,
  useSaunaEditorState,
  useSaunaEditorActions,
} from "../context";
import { SidebarHeaderView } from "./SidebarHeader";
import { cx } from "../utils/classNames";

export interface DesktopSidebarViewProps {
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
  exporting: boolean;
  importing: boolean;
  onLogout?: () => void;
  userEmail?: string | null;
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportClick: () => void;
  onImportChange: (e: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}

export function DesktopSidebarView({
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
  exporting,
  importing,
  onLogout,
  userEmail,
  importInputRef,
  onImportClick,
  onImportChange,
  children,
}: DesktopSidebarViewProps) {
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
      <aside className={cx("sidebar", !isSidebarExpanded && "collapsed")}>
        <button
          className="mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="パネルを開く・閉じる"
        >
          {isSidebarExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
        <SidebarHeaderView
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={onToggleSidebar}
          isMobileMenuOpen={isMobileMenuOpen}
          mobileMenuRef={mobileMenuRef}
          onToggleMobileMenu={onToggleMobileMenu}
          onCloseMobileMenu={onCloseMobileMenu}
          isAdding={isAdding}
          onStartNewVisit={onStartNewVisit}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenShareView={onOpenShareView}
          onExportVisits={onExportVisits}
          exporting={exporting}
          importing={importing}
          onImportClick={onImportClick}
          onLogout={onLogout}
          userEmail={userEmail}
        />

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

/** Context から値を集めて View へ渡すだけのコンテナ（テストは DesktopSidebarView を描画する） */
export function DesktopSidebar({ children }: { children: ReactNode }) {
  const {
    isMobileMenuOpen,
    mobileMenuRef,
    toggleMobileMenu,
    closeMobileMenu,
    theme,
    toggleTheme,
    openShareView,
  } = useSaunaUI();
  // 記録本体は購読しない（エクスポートはクリック時点の記録を読む）
  const { importInputRef, exportVisits, handleImportData, logout } = useVisitsActions();
  const { importing, exporting, dataSource, user } = useVisitsStatus();
  const { isSidebarExpanded, isAdding } = useSaunaEditorState();
  const { toggleSidebar, startNewVisit } = useSaunaEditorActions();

  return (
    <DesktopSidebarView
      isSidebarExpanded={isSidebarExpanded}
      onToggleSidebar={toggleSidebar}
      isMobileMenuOpen={isMobileMenuOpen}
      mobileMenuRef={mobileMenuRef}
      onToggleMobileMenu={toggleMobileMenu}
      onCloseMobileMenu={closeMobileMenu}
      isAdding={isAdding}
      onStartNewVisit={startNewVisit}
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenShareView={openShareView}
      onExportVisits={() => void exportVisits()}
      exporting={exporting}
      importing={importing}
      onLogout={dataSource === "api" ? () => void logout() : undefined}
      userEmail={user?.email}
      importInputRef={importInputRef}
      onImportClick={() => importInputRef.current?.click()}
      onImportChange={handleImportData}
    >
      {children}
    </DesktopSidebarView>
  );
}
