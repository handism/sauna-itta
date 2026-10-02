import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SidebarHeaderView } from "./SidebarHeader";

describe("SidebarHeaderView", () => {
  afterEach(cleanup);

  const defaultProps = {
    isSidebarExpanded: true,
    onToggleSidebar: vi.fn(),
    isMobileMenuOpen: false,
    mobileMenuRef: { current: null },
    onToggleMobileMenu: vi.fn(),
    onCloseMobileMenu: vi.fn(),
    isAdding: false,
    onStartNewVisit: vi.fn(),
    theme: "dark" as const,
    onToggleTheme: vi.fn(),
    onOpenShareView: vi.fn(),
    onExportVisits: vi.fn(),
    exporting: false,
    importing: false,
    onImportClick: vi.fn(),
  };

  it("ヘッダータイトルを正しくレンダリングする", () => {
    render(<SidebarHeaderView {...defaultProps} />);
    expect(screen.getByText("サウナイッタ")).toBeInTheDocument();
    expect(screen.getByText("マイととのいマップ")).toBeInTheDocument();
  });

  it("新規ピンボタンクリックで onStartNewVisit が呼ばれる", () => {
    render(<SidebarHeaderView {...defaultProps} />);
    const plusBtn = screen.getByLabelText("新規ピンを立てる");
    fireEvent.click(plusBtn);
    expect(defaultProps.onStartNewVisit).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCloseMobileMenu).toHaveBeenCalledTimes(1);
  });

  it("ログアウトは onLogout を渡したときだけ表示し、アカウントのメールアドレスを添える", () => {
    const { rerender } = render(<SidebarHeaderView {...defaultProps} isMobileMenuOpen />);
    expect(screen.queryByRole("menuitem", { name: /ログアウト/ })).not.toBeInTheDocument();

    const onLogout = vi.fn();
    rerender(
      <SidebarHeaderView {...defaultProps} isMobileMenuOpen onLogout={onLogout} userEmail="owner@example.com" />,
    );
    const logoutItem = screen.getByRole("menuitem", { name: /ログアウト/ });
    expect(logoutItem).toHaveTextContent("owner@example.com");
    fireEvent.click(logoutItem);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("メニューはシェア・データ・アカウントの間を区切り線で分ける", () => {
    const { rerender } = render(<SidebarHeaderView {...defaultProps} isMobileMenuOpen />);
    expect(screen.getAllByRole("separator")).toHaveLength(1);

    rerender(<SidebarHeaderView {...defaultProps} isMobileMenuOpen onLogout={vi.fn()} />);
    const menu = screen.getByRole("menu");
    const order = Array.from(menu.children).map((el) =>
      el.getAttribute("role") === "separator" ? "---" : el.textContent?.trim()
    );
    expect(order).toEqual(["シェア用ビュー", "---", "エクスポート", "インポート", "---", "ログアウト"]);
  });

  it("書き出し中はエクスポートを押せない", () => {
    render(<SidebarHeaderView {...defaultProps} isMobileMenuOpen exporting />);
    expect(screen.getByRole("menuitem", { name: /書き出し中/ })).toBeDisabled();
  });

  describe("メニューのキーボード操作", () => {
    const openMenu = (props: Partial<typeof defaultProps> = {}) =>
      render(<SidebarHeaderView {...defaultProps} {...props} isMobileMenuOpen />);

    it("トリガーはメニューを開くことを公開し、開いたら先頭の項目へフォーカスする", () => {
      openMenu();
      const trigger = screen.getByRole("button", { name: "メニュー" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-controls", screen.getByRole("menu").id);
      expect(screen.getByRole("menu")).toHaveAccessibleName("メニュー");
      expect(screen.getByRole("menuitem", { name: /シェア用ビュー/ })).toHaveFocus();
    });

    it("↑↓ は端で循環し、Home／End で両端へ移動する。押せない項目は飛ばす", () => {
      openMenu({ exporting: true });
      const menu = screen.getByRole("menu");
      const share = screen.getByRole("menuitem", { name: /シェア用ビュー/ });
      const importItem = screen.getByRole("menuitem", { name: /インポート/ });

      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(importItem).toHaveFocus();
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(share).toHaveFocus();
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(importItem).toHaveFocus();
      fireEvent.keyDown(menu, { key: "Home" });
      expect(share).toHaveFocus();
      fireEvent.keyDown(menu, { key: "End" });
      expect(importItem).toHaveFocus();
    });

    it("Escape で閉じてトリガーへフォーカスを戻す", () => {
      const onCloseMobileMenu = vi.fn();
      openMenu({ onCloseMobileMenu });
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      expect(onCloseMobileMenu).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "メニュー" })).toHaveFocus();
    });

    it("Tab で確定せずに閉じる", () => {
      const onCloseMobileMenu = vi.fn();
      const onOpenShareView = vi.fn();
      openMenu({ onCloseMobileMenu, onOpenShareView });
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab" });
      expect(onCloseMobileMenu).toHaveBeenCalledTimes(1);
      expect(onOpenShareView).not.toHaveBeenCalled();
    });

    it("項目を選ぶとフォーカスをトリガーへ戻してから実行する", () => {
      const onOpenShareView = vi.fn(() => {
        expect(screen.getByRole("button", { name: "メニュー" })).toHaveFocus();
      });
      const onCloseMobileMenu = vi.fn();
      openMenu({ onOpenShareView, onCloseMobileMenu });
      fireEvent.click(screen.getByRole("menuitem", { name: /シェア用ビュー/ }));
      expect(onOpenShareView).toHaveBeenCalledTimes(1);
      expect(onCloseMobileMenu).toHaveBeenCalledTimes(1);
    });
  });
});
