"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type ModalType = "share" | "filter" | "deleteConfirm" | null;

export function useUIState() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const openModal = useCallback((modal: ModalType) => setActiveModal(modal), []);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((v) => !v), []);

  const openShareView = useCallback(() => setActiveModal("share"), []);
  const closeShareView = useCallback(() => {
    setActiveModal((current) => (current === "share" ? null : current));
  }, []);

  const openFilterModal = useCallback(() => setActiveModal("filter"), []);
  const closeFilterModal = useCallback(() => {
    setActiveModal((current) => (current === "filter" ? null : current));
  }, []);

  const openDeleteConfirm = useCallback(() => setActiveModal("deleteConfirm"), []);
  const closeDeleteConfirm = useCallback(() => {
    setActiveModal((current) => (current === "deleteConfirm" ? null : current));
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileMenuRef.current?.contains(target)) return;
      setIsMobileMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return {
    activeModal,
    isShareViewOpen: activeModal === "share",
    isMobileMenuOpen,
    isFilterModalOpen: activeModal === "filter",
    isDeleteConfirmOpen: activeModal === "deleteConfirm",
    mobileMenuRef,
    openModal,
    closeModal,
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
