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

export interface UIStateContextType {
  isMobile: boolean;
  mounted: boolean;
  theme: "dark" | "light";
  isShareViewOpen: boolean;
  isMobileMenuOpen: boolean;
  isFilterModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  toast: ReturnType<typeof useToast>["toast"];
}

export interface UIActionsContextType {
  toggleTheme: () => void;
  openShareView: () => void;
  closeShareView: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;
  showToast: ReturnType<typeof useToast>["showToast"];
  clearToast: ReturnType<typeof useToast>["clearToast"];
}

export type UIContextType = UIStateContextType & UIActionsContextType;

const UIStateContext = createContext<UIStateContextType | null>(null);
const UIActionsContext = createContext<UIActionsContextType | null>(null);

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

  const stateValue = useMemo(
    () => ({
      isMobile,
      mounted,
      theme,
      isShareViewOpen,
      isMobileMenuOpen,
      isFilterModalOpen,
      isDeleteConfirmOpen,
      mobileMenuRef,
      toast,
    }),
    [
      isMobile,
      mounted,
      theme,
      isShareViewOpen,
      isMobileMenuOpen,
      isFilterModalOpen,
      isDeleteConfirmOpen,
      mobileMenuRef,
      toast,
    ],
  );

  const actionsValue = useMemo(
    () => ({
      toggleTheme,
      openShareView,
      closeShareView,
      toggleMobileMenu,
      closeMobileMenu,
      openFilterModal,
      closeFilterModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      showToast,
      clearToast,
    }),
    [
      toggleTheme,
      openShareView,
      closeShareView,
      toggleMobileMenu,
      closeMobileMenu,
      openFilterModal,
      closeFilterModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      showToast,
      clearToast,
    ],
  );

  return (
    <UIStateContext.Provider value={stateValue}>
      <UIActionsContext.Provider value={actionsValue}>
        {children}
      </UIActionsContext.Provider>
    </UIStateContext.Provider>
  );
}

export function useSaunaUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useSaunaUIState must be used within a UIProvider");
  }
  return context;
}

export function useSaunaUIActions() {
  const context = useContext(UIActionsContext);
  if (!context) {
    throw new Error("useSaunaUIActions must be used within a UIProvider");
  }
  return context;
}

export function useSaunaUI(): UIContextType {
  const state = useSaunaUIState();
  const actions = useSaunaUIActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
