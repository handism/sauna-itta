import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { RefObject } from "react";
import { DesktopSidebarView, type DesktopSidebarViewProps } from "./DesktopSidebar";

function renderSidebar(overrides: Partial<DesktopSidebarViewProps> = {}) {
  const defaultProps: DesktopSidebarViewProps = {
    isSidebarExpanded: true,
    onToggleSidebar: vi.fn(),
    isMobileMenuOpen: false,
    mobileMenuRef: { current: null } as RefObject<HTMLDivElement | null>,
    onToggleMobileMenu: vi.fn(),
    onCloseMobileMenu: vi.fn(),
    isAdding: false,
    onStartNewVisit: vi.fn(),
    theme: "light",
    onToggleTheme: vi.fn(),
    onOpenShareView: vi.fn(),
    onExportVisits: vi.fn(),
    importing: false,
    importInputRef: { current: null } as RefObject<HTMLInputElement | null>,
    onImportClick: vi.fn(),
    onImportChange: vi.fn(),
    children: <div data-testid="sidebar-children">Content</div>,
  };

  const props = { ...defaultProps, ...overrides };
  const utils = render(<DesktopSidebarView {...props} />);

  return { props, ...utils };
}

describe("DesktopSidebarView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children content correctly", () => {
    renderSidebar();
    expect(screen.getByTestId("sidebar-children")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-children")).toHaveTextContent("Content");
  });

  it("calls onToggleSidebar when toggle buttons are clicked", () => {
    const { props } = renderSidebar({ isSidebarExpanded: false });

    // When collapsed, the open button should be visible
    const openBtn = screen.getByRole("button", { name: "サイドバーを開く" });
    fireEvent.click(openBtn);
    expect(props.onToggleSidebar).toHaveBeenCalledTimes(1);

    cleanup();

    const { props: propsExpanded } = renderSidebar({ isSidebarExpanded: true });
    // When expanded, the toggle in the aside should be visible
    const toggleBtn = screen.getByRole("button", { name: "パネルを開く・閉じる" });
    fireEvent.click(toggleBtn);
    expect(propsExpanded.onToggleSidebar).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole("button", { name: "サイドバーを折りたたむ" });
    fireEvent.click(closeBtn);
    expect(propsExpanded.onToggleSidebar).toHaveBeenCalledTimes(2);
  });

  it("shows and hides 'New Visit' button based on isAdding state", () => {
    const { props: propsNotAdding, unmount } = renderSidebar({ isAdding: false });
    const newVisitBtn = screen.getByRole("button", { name: "新規ピンを立てる" });
    expect(newVisitBtn).toBeInTheDocument();

    fireEvent.click(newVisitBtn);
    expect(propsNotAdding.onStartNewVisit).toHaveBeenCalledTimes(1);
    expect(propsNotAdding.onCloseMobileMenu).toHaveBeenCalledTimes(1);

    unmount();

    renderSidebar({ isAdding: true });
    expect(screen.queryByRole("button", { name: "新規ピンを立てる" })).not.toBeInTheDocument();
  });

  it("toggles theme correctly", () => {
    const { props, unmount } = renderSidebar({ theme: "light" });
    const themeBtn = screen.getByRole("button", { name: "ダークモードに切り替え" });
    expect(themeBtn).toBeInTheDocument();

    fireEvent.click(themeBtn);
    expect(props.onToggleTheme).toHaveBeenCalledTimes(1);

    unmount();

    renderSidebar({ theme: "dark" });
    expect(screen.getByRole("button", { name: "ライトモードに切り替え" })).toBeInTheDocument();
  });

  it("renders mobile menu dropdown when isMobileMenuOpen is true", () => {
    const { props } = renderSidebar({ isMobileMenuOpen: true });

    expect(screen.getByRole("menu")).toBeInTheDocument();

    const shareBtn = screen.getByRole("menuitem", { name: /シェア用ビュー/ });
    fireEvent.click(shareBtn);
    expect(props.onOpenShareView).toHaveBeenCalledTimes(1);
    expect(props.onCloseMobileMenu).toHaveBeenCalledTimes(1);

    const exportBtn = screen.getByRole("menuitem", { name: /エクスポート/ });
    fireEvent.click(exportBtn);
    expect(props.onExportVisits).toHaveBeenCalledTimes(1);
    expect(props.onCloseMobileMenu).toHaveBeenCalledTimes(2);

    const importBtn = screen.getByRole("menuitem", { name: /インポート/ });
    fireEvent.click(importBtn);
    expect(props.onImportClick).toHaveBeenCalledTimes(1);
    expect(props.onCloseMobileMenu).toHaveBeenCalledTimes(3);
  });

  it("displays loading state when importing is true", () => {
    renderSidebar({ isMobileMenuOpen: true, importing: true });

    const importBtn = screen.getByRole("menuitem", { name: /取り込み中.../ });
    expect(importBtn).toBeInTheDocument();
    expect(importBtn).toBeDisabled();
  });

  it("renders stats link correctly", () => {
    renderSidebar();
    const statsLink = screen.getByRole("link", { name: "統計ダッシュボード" });
    expect(statsLink).toBeInTheDocument();
    expect(statsLink).toHaveAttribute("href", "/stats");
  });

  it("calls onCloseMobileMenu when backdrop is clicked", () => {
    const { props } = renderSidebar({ isMobileMenuOpen: true });

    const backdrop = document.querySelector(".mobile-menu-backdrop");
    expect(backdrop).not.toBeNull();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(props.onCloseMobileMenu).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onImportChange when file input changes", () => {
    const { props, container } = renderSidebar();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    fireEvent.change(input, { target: { files: [] } });
    expect(props.onImportChange).toHaveBeenCalledTimes(1);
  });
});
