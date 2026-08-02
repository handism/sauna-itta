import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ApiAccessGate } from "./ApiAccessGate";

afterEach(cleanup);

describe("ApiAccessGate", () => {
  it("CSRFトークンを含むPOSTフォームでGoogleログインを開始する", () => {
    const { container } = render(
      <ApiAccessGate
        loading={false}
        authenticated={false}
        csrfToken="csrf-token"
        error={null}
        onRetry={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Googleでログイン" });
    const form = button.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/auth/google_oauth2");
    expect(container.querySelector('input[name="authenticity_token"]')).toHaveValue("csrf-token");
  });

  it("CSRFトークンが無い間はログインボタンを無効化する", () => {
    render(
      <ApiAccessGate
        loading={false}
        authenticated={false}
        csrfToken={null}
        error={null}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeDisabled();
  });
});
