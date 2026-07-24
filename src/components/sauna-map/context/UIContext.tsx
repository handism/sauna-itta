"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useSyncExternalStore,
  ReactNode,
  RefObject,
} from "react";
import { useUIState } from "../hooks/useUIState";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { getInitialIsMobile, MOBILE_BREAKPOINT } from "../utils";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface UIContextType {
  isMobile: boolean;
  mounted: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;

  // UI Modals
  isShareViewOpen: boolean;
  isMobileMenuOpen: boolean;
  isFilterModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  openShareView: () => void;
  closeShareView: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;

  // Toast
  toast: ReturnType<typeof useToast>["toast"];
  showToast: ReturnType<typeof useToast>["showToast"];
  clearToast: ReturnType<typeof useToast>["clearToast"];
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const {
    isShareViewOpen,
    isMobileMenuOpen,
    isFilterModalOpen,
    isDeleteConfirmOpen,
    mobileMenuRef,
    openShareView,
    closeShareView,
    toggleMobileMenu,
    closeMobileMenu,
    openFilterModal,
    closeFilterModal,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useUIState();

  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = useMemo(
    () => ({
      isMobile,
      mounted,
      theme,
      toggleTheme,
      isShareViewOpen,
      isMobileMenuOpen,
      isFilterModalOpen,
      isDeleteConfirmOpen,
      mobileMenuRef,
      openShareView,
      closeShareView,
      toggleMobileMenu,
      closeMobileMenu,
      openFilterModal,
      closeFilterModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      toast,
      showToast,
      clearToast,
    }),
    [
      isMobile,
      mounted,
      theme,
      toggleTheme,
      isShareViewOpen,
      isMobileMenuOpen,
      isFilterModalOpen,
      isDeleteConfirmOpen,
      mobileMenuRef,
      openShareView,
      closeShareView,
      toggleMobileMenu,
      closeMobileMenu,
      openFilterModal,
      closeFilterModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      toast,
      showToast,
      clearToast,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useSaunaUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useSaunaUI must be used within a UIProvider");
  }
  return context;
}
