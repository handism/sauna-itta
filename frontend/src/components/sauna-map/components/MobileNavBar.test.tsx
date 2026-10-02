import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MobileNavBar, type MobileNavBarProps } from "./MobileNavBar";

function renderNav(overrides: Partial<MobileNavBarProps> = {}) {
  const onSelectTab = vi.fn();
  const onOpenFilter = vi.fn();
  const utils = render(
    <MobileNavBar
      onSelectTab={onSelectTab}
      snapPosition="half"
      isAdding={false}
      onOpenFilter={onOpenFilter}
      isFilterPanelOpen={false}
      isFilterActive={false}
      {...overrides}
    />,
  );
  return { onSelectTab, onOpenFilter, ...utils };
}

describe("MobileNavBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("シートが最小のときはマップを現在地として公開する", () => {
    renderNav({ snapPosition: "min" });

    expect(screen.getByRole("button", { name: /マップ/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /一覧/ })).not.toHaveAttribute("aria-current");
  });

  it("シートが開いているときは一覧を現在地として公開する", () => {
    renderNav({ snapPosition: "full" });

    expect(screen.getByRole("button", { name: /一覧/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /マップ/ })).not.toHaveAttribute("aria-current");
  });

  it("追加中はシート位置に関わらず追加だけを現在地にする", () => {
    renderNav({ isAdding: true, snapPosition: "min" });

    expect(screen.getByRole("button", { name: "サウナ追加" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /マップ/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: /一覧/ })).not.toHaveAttribute("aria-current");
  });

  it("各タブは対応するキーでonSelectTabを呼ぶ", () => {
    const { onSelectTab } = renderNav();

    fireEvent.click(screen.getByRole("button", { name: /マップ/ }));
    fireEvent.click(screen.getByRole("button", { name: /一覧/ }));
    fireEvent.click(screen.getByRole("button", { name: "サウナ追加" }));

    expect(onSelectTab.mock.calls).toEqual([["map"], ["list"], ["add"]]);
  });

  it("フィルターはパネルの開閉ボタンとして状態をaria-expandedで公開する", () => {
    const { onOpenFilter, unmount } = renderNav();

    const filterButton = screen.getByRole("button", { name: "フィルター" });
    expect(filterButton).toHaveAttribute("aria-expanded", "false");
    // 絞り込みのオン／オフを切り替えるトグルではない
    expect(filterButton).not.toHaveAttribute("aria-pressed");

    fireEvent.click(filterButton);
    expect(onOpenFilter).toHaveBeenCalledOnce();
    unmount();

    renderNav({ isFilterPanelOpen: true });
    expect(screen.getByRole("button", { name: "フィルター" })).toHaveAttribute("aria-expanded", "true");
  });

  it("絞り込み中はドットに加えて読み上げ用の補足で伝える", () => {
    const { container, unmount } = renderNav();
    expect(container.querySelector(".filter-active-dot")).toBeNull();
    unmount();

    const active = renderNav({ isFilterActive: true });
    expect(screen.getByRole("button", { name: "フィルター（絞り込み中）" })).toHaveClass("is-active");
    expect(active.container.querySelector(".filter-active-dot")).not.toBeNull();
  });

  it("統計はタブではなくリンクとして提供する", () => {
    renderNav();

    expect(screen.getByRole("link", { name: /統計/ })).toHaveAttribute("href", "/stats");
  });
});
