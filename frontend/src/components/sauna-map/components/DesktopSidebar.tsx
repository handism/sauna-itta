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
  useVisitsCRUD,
  useSaunaEditorState,
  useSaunaEditorActions,
} from "../context";
import { SidebarHeaderView } from "./SidebarHeader";

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
  importing: boolean;
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
  importing,
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
      <aside className={`sidebar ${!isSidebarExpanded ? "collapsed" : ""}`}>
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
          importing={importing}
          onImportClick={onImportClick}
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
  const { importInputRef, exportVisits, importing, handleImportData } = useVisitsCRUD();
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
      onExportVisits={exportVisits}
      importing={importing}
      importInputRef={importInputRef}
      onImportClick={() => importInputRef.current?.click()}
      onImportChange={handleImportData}
    >
      {children}
    </DesktopSidebarView>
  );
}
