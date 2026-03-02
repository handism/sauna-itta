"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useUIState(isSidebarExpandedInitial: boolean) {
  const [isShareViewOpen, setIsShareViewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((v) => !v), []);
  const openShareView = useCallback(() => setIsShareViewOpen(true), []);
  const closeShareView = useCallback(() => setIsShareViewOpen(false), []);
  const openFilterModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeFilterModal = useCallback(() => setIsFilterModalOpen(false), []);
  const openDeleteConfirm = useCallback(() => setIsDeleteConfirmOpen(true), []);
  const closeDeleteConfirm = useCallback(() => setIsDeleteConfirmOpen(false), []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileMenuRef.current?.contains(target)) return;
      closeMobileMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return {
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
  };
}
