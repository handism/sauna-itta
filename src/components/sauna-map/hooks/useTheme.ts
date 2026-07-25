import { useState, useEffect, useCallback } from "react";
import { getInitialTheme, applyThemeClass, saveTheme } from "../utils";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";
      saveTheme(newTheme);
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
