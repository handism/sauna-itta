"use client";

import { KeyboardEvent, RefObject, useEffect, useId, useRef } from "react";
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
  LogOut,
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
  exporting: boolean;
  importing: boolean;
  onImportClick: () => void;
  /** apiモードでだけ渡す。localモードにはログインの概念がないため項目ごと出さない */
  onLogout?: () => void;
  userEmail?: string | null;
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
  exporting,
  importing,
  onImportClick,
  onLogout,
  userEmail,
}: SidebarHeaderViewProps) {
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuTriggerId = useId();

  // WAI-ARIA の Menu Button パターン: 開いたら先頭の項目へフォーカスを移す
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    getEnabledMenuItems(menuRef.current)[0]?.focus();
  }, [isMobileMenuOpen]);

  /**
   * 項目の実行前にフォーカスをトリガーへ戻す。メニューが消えるとフォーカスが body へ
   * 落ちるため。シェア用ビュー等のモーダルを閉じたときも、ここへ戻ってくる。
   */
  const selectMenuItem = (action: () => void) => {
    menuTriggerRef.current?.focus();
    action();
    onCloseMobileMenu();
  };

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCloseMobileMenu();
      menuTriggerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      // 確定せず閉じ、フォーカスは通常の Tab 移動に任せる
      onCloseMobileMenu();
      return;
    }

    const items = getEnabledMenuItems(e.currentTarget);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    switch (e.key) {
      case "ArrowDown":
        next = (current + 1) % items.length;
        break;
      case "ArrowUp":
        next = (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    items[next].focus();
  };

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
          ref={menuTriggerRef}
          id={menuTriggerId}
          type="button"
          className="mobile-menu-btn sidebar-action-btn"
          onClick={onToggleMobileMenu}
          aria-label="メニュー"
          aria-haspopup="menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls={isMobileMenuOpen ? menuId : undefined}
        >
          <MoreHorizontal size={18} />
        </button>
        {isMobileMenuOpen && (
          <div
            className={`mobile-menu-dropdown ${
              isSidebarExpanded ? "mobile-menu-dropdown--down" : ""
            }`}
            role="menu"
            id={menuId}
            ref={menuRef}
            aria-labelledby={menuTriggerId}
            onKeyDown={handleMenuKeyDown}
          >
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => selectMenuItem(onOpenShareView)}
            >
              <Camera size={15} /> シェア用ビュー
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={exporting}
              onClick={() => selectMenuItem(onExportVisits)}
            >
              {exporting ? (
                <>
                  <Loader2 size={15} className="spin-icon" /> 書き出し中...
                </>
              ) : (
                <>
                  <Download size={15} /> エクスポート
                </>
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={importing}
              onClick={() => selectMenuItem(onImportClick)}
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
            {onLogout && (
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                title={userEmail ?? undefined}
                onClick={() => selectMenuItem(onLogout)}
              >
                <LogOut size={15} />
                <span className="mobile-menu-item-label">
                  ログアウト
                  {userEmail && <span className="mobile-menu-item-subtext">{userEmail}</span>}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 矢印キーで移動できるメニュー項目（処理中で押せない項目は飛ばす） */
function getEnabledMenuItems(menu: HTMLElement | null): HTMLButtonElement[] {
  if (!menu) return [];
  return Array.from(
    menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
  );
}
