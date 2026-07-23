import { useState, useEffect, useCallback } from "react";
import { getInitialTheme, applyThemeClass, THEME_STORAGE_KEY } from "../utils";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
      }
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
