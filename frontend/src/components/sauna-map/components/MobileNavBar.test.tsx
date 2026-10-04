import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MobileNavBar, type MobileNavBarProps } from "./MobileNavBar";

function renderNav(overrides: Partial<MobileNavBarProps> = {}) {
  const onSelectTab = vi.fn();
  const utils = render(
    <MobileNavBar
      onSelectTab={onSelectTab}
      snapPosition="half"
      isAdding={false}
      {...overrides}
    />,
  );
  return { onSelectTab, ...utils };
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

  it("詳細フィルターは一覧側にあるため、ナビには置かない", () => {
    renderNav();

    expect(screen.queryByRole("button", { name: /フィルター/ })).toBeNull();
  });

  it("統計はタブではなくリンクとして提供する", () => {
    renderNav();

    expect(screen.getByRole("link", { name: /統計/ })).toHaveAttribute("href", "/stats");
  });
});
