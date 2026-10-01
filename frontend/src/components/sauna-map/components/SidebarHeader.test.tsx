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

  it("書き出し中はエクスポートを押せない", () => {
    render(<SidebarHeaderView {...defaultProps} isMobileMenuOpen exporting />);
    expect(screen.getByRole("menuitem", { name: /書き出し中/ })).toBeDisabled();
  });
});
