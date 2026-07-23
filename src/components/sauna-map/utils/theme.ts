import { THEME_STORAGE_KEY, MOBILE_BREAKPOINT } from "./constants";

export function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
    return "dark";
  }
}

export function getInitialIsMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

export function applyThemeClass(theme: "dark" | "light"): void {
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  } else {
    document.documentElement.classList.remove("light-theme");
  }
}
