import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
    cleanup();
  });

  it("renders null without throwing errors", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container.firstChild).toBeNull();
  });

  it("attempts to register service worker when available", () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: "/sauna-itta/" });

    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          register: registerMock,
        },
      },
      writable: true,
    });

    render(<ServiceWorkerRegister />);

    // Dispatch load event to trigger registration callback
    window.dispatchEvent(new Event("load"));

    expect(registerMock).toHaveBeenCalledWith("/sauna-itta/sw.js", { scope: "/sauna-itta/" });
  });

  it("logs a warning when service worker registration fails", async () => {
    const error = new Error("Registration failed");
    const registerMock = vi.fn().mockRejectedValue(error);
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          register: registerMock,
        },
      },
      writable: true,
    });

    render(<ServiceWorkerRegister />);

    // Dispatch load event to trigger registration callback
    window.dispatchEvent(new Event("load"));

    // Allow promise rejection to propagate
    await new Promise(process.nextTick);

    expect(consoleWarnSpy).toHaveBeenCalledWith("ServiceWorker registration failed:", error);

    consoleWarnSpy.mockRestore();
  });
});
