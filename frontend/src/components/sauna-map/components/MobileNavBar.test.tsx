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

  it("フィルターはトグルとして状態をaria-pressedで公開する", () => {
    const { onOpenFilter, container, unmount } = renderNav();

    const filterButton = screen.getByRole("button", { name: /フィルター/ });
    expect(filterButton).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector(".filter-active-dot")).toBeNull();

    fireEvent.click(filterButton);
    expect(onOpenFilter).toHaveBeenCalledOnce();
    unmount();

    const active = renderNav({ isFilterActive: true });
    expect(screen.getByRole("button", { name: /フィルター/ })).toHaveAttribute("aria-pressed", "true");
    expect(active.container.querySelector(".filter-active-dot")).not.toBeNull();
  });

  it("統計はタブではなくリンクとして提供する", () => {
    renderNav();

    expect(screen.getByRole("link", { name: /統計/ })).toHaveAttribute("href", "/stats");
  });
});
