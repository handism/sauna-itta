"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  ChangeEvent,
  FormEvent,
  RefObject,
} from "react";

import { useToast } from "../hooks/useToast";
import { useSaunaVisits } from "../hooks/useSaunaVisits";
import { useEditorState } from "../hooks/useEditorState";
import { useVisitFilters } from "../hooks/useVisitFilters";
import { useUIState } from "../hooks/useUIState";
import { useTheme } from "../hooks/useTheme";
import { useMapViewState } from "../hooks/useMapViewState";
import { MobileTab } from "../components/MobileNavBar";
import { SheetSnapPosition } from "../types";

import {
  getDefaultForm,
  getInitialIsMobile,
  getTodayDate,
  MOBILE_BREAKPOINT,
  getVisitHistoryEntries,
  toFormState,
  compressAndGetBase64,
} from "../utils";
import { SaunaVisit, VisitFormState, LatLng } from "../types";

const STORAGE_ERROR_MSG =
  "画像サイズが大きすぎるため保存に失敗しました。画像を小さくして再度お試しください。";

interface SaunaMapContextType {
  // Common state
  isMobile: boolean;
  mounted: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Visits & Filter
  visits: SaunaVisit[];
  filteredVisits: SaunaVisit[];
  filters: ReturnType<typeof useVisitFilters>["filters"];
  setFilters: ReturnType<typeof useVisitFilters>["setFilters"];
  stats: ReturnType<typeof useVisitFilters>["stats"];
  isFilterActive: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
  exportVisits: () => void;

  // Form & CRUD / Edit state
  form: VisitFormState;
  setForm: React.Dispatch<React.SetStateAction<VisitFormState>>;
  editorState: ReturnType<typeof useEditorState>["state"];
  mode: ReturnType<typeof useEditorState>["state"]["mode"];
  editingId: string | null;
  selectedLocation: LatLng | null;
  isSidebarExpanded: boolean;
  isAdding: boolean;
  isMobilePickingLocation: boolean;
  isCreating: boolean;
  editingVisit: SaunaVisit | null;
  historyEntries: ReturnType<typeof getVisitHistoryEntries>;
  imageUploading: boolean;
  importing: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;

  // Form / Edit Actions
  startNewVisit: () => void;
  startEditing: (visit: SaunaVisit) => void;
  handleDelete: () => void;
  confirmDelete: () => void;
  handleLocationSelect: (lat: number, lng: number) => void;
  handleBoundsChange: (bounds: { northEast: LatLng; southWest: LatLng }) => void;
  handleSubmit: (e: FormEvent) => void;
  handleImageFile: (file: File) => Promise<void>;
  handleRemoveImage: () => void;
  handleImportData: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDeleteHistoryEntry: (index: number) => void;
  cancelEditing: (completed?: boolean) => void;
  toggleSidebar: () => void;

  // Map View State
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeMapTarget: LatLng | null;
  snapPosition: SheetSnapPosition;
  setSnapPosition: (pos: SheetSnapPosition) => void;
  handleZoomChange: (zoom: number) => void;
  enableClustering: boolean;
  toggleClustering: () => void;
  showBadges: boolean;
  selectedVisit: SaunaVisit | null;
  handleSelectVisit: (visit: SaunaVisit) => void;
  handleDeselectVisit: () => void;
  handleListEdit: (visit: SaunaVisit) => void;
  handleListSelectVisit: (visit: SaunaVisit) => void;
  handleSelectMobileTab: (tab: MobileTab) => void;

  // UI Modals & Toasts
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
  toast: ReturnType<typeof useToast>["toast"];
  showToast: ReturnType<typeof useToast>["showToast"];
  clearToast: ReturnType<typeof useToast>["clearToast"];
}

const SaunaMapContext = createContext<SaunaMapContextType | null>(null);

export function SaunaMapProvider({ children }: { children: ReactNode }) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { visits, addVisit, editVisit, deleteVisit, removeHistoryEntry, importVisitsFromFile, exportVisits } =
    useSaunaVisits();
  const { filters, setFilters, filteredVisits, stats, isFilterActive, activeFilterCount, clearFilters } =
    useVisitFilters(visits);

  const [form, setForm] = useState<VisitFormState>(getDefaultForm());
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);
  const [mounted, setMounted] = useState(false);

  const {
    state: editorState,
    startCreate,
    startEdit,
    selectLocation,
    cancelEdit,
    toggleSidebar,
  } = useEditorState(isMobile);
  const { mode, editingId, selectedLocation, isSidebarExpanded, mapTarget } = editorState;

  const {
    hoveredId,
    setHoveredId,
    selectedId,
    setSelectedId,
    mapTargetOverride,
    snapPosition,
    setSnapPosition,
    handleZoomChange,
    enableClustering,
    toggleClustering,
    showBadges,
    selectedVisit,
    handleSelectVisit,
    handleDeselectVisit,
  } = useMapViewState(visits, isMobile);

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
  const [imageUploading, setImageUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const activeMapTarget = mapTargetOverride || mapTarget;

  const cancelEditing = useCallback(
    (completed = false) => {
      cancelEdit(completed);
      setForm(getDefaultForm());
      if (isMobile) {
        setSnapPosition("min");
      }
    },
    [cancelEdit, isMobile, setSnapPosition],
  );

  const handleSelectMobileTab = useCallback(
    (tab: MobileTab) => {
      if (tab === "map") {
        cancelEditing(true);
        setSnapPosition("min");
      } else if (tab === "list") {
        cancelEditing(true);
        setSnapPosition("half");
      } else if (tab === "add") {
        startCreate();
        setSnapPosition("full");
      }
    },
    [cancelEditing, startCreate, setSnapPosition],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const startNewVisit = useCallback(() => {
    startCreate();
    setForm(getDefaultForm(getTodayDate()));
  }, [startCreate]);

  const startEditing = useCallback(
    (visit: SaunaVisit) => {
      setSelectedId(visit.id);
      startEdit(visit);
      setForm(toFormState(visit));
      if (isMobile) {
        setSnapPosition("full");
      }
    },
    [setSelectedId, startEdit, isMobile, setSnapPosition],
  );

  const handleDelete = useCallback(() => {
    if (!editingId) return;
    openDeleteConfirm();
  }, [editingId, openDeleteConfirm]);

  const confirmDelete = useCallback(() => {
    if (!editingId) return;
    const { success } = deleteVisit(editingId);
    if (!success) {
      showToast(STORAGE_ERROR_MSG, "error");
    } else {
      showToast("記録を削除しました。", "success");
    }
    closeDeleteConfirm();
    cancelEditing(true);
  }, [editingId, deleteVisit, showToast, closeDeleteConfirm, cancelEditing]);

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      selectLocation({ lat, lng });
    },
    [selectLocation],
  );

  const handleBoundsChange = useCallback(
    (bounds: { northEast: LatLng; southWest: LatLng }) => {
      setFilters((prev) => ({
        ...prev,
        mapBounds: bounds,
      }));
    },
    [setFilters],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!selectedLocation || !form.name) return;

      let success = false;
      if (editingId) {
        const result = editVisit(editingId, selectedLocation, form);
        success = result.success;
      } else {
        const result = addVisit(selectedLocation, form);
        success = result.success;
      }

      if (!success) {
        showToast(STORAGE_ERROR_MSG, "error");
      }

      cancelEditing(true);
    },
    [selectedLocation, form, editingId, editVisit, addVisit, showToast, cancelEditing],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      setImageUploading(true);
      try {
        const base64 = await compressAndGetBase64(file);
        setForm((prev) => ({ ...prev, image: base64 }));
      } catch (error) {
        console.error(error);
        showToast("画像の圧縮に失敗しました。別の画像で試してください。", "error");
      } finally {
        setImageUploading(false);
      }
    },
    [showToast],
  );

  const handleRemoveImage = useCallback(() => {
    setForm((prev) => ({ ...prev, image: "" }));
  }, []);

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, success } = await importVisitsFromFile(file);
        if (added === 0) {
          showToast("新しく追加されるデータはありませんでした。", "info");
          return;
        }

        if (!success) {
          showToast(STORAGE_ERROR_MSG, "error");
        } else {
          showToast(`データを${added}件取り込みました。`, "success");
        }
      } catch (error) {
        console.error(error);
        showToast("JSONの読み込みに失敗しました。ファイル形式を確認してください。", "error");
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

  const isAdding = mode !== "list";
  const isMobilePickingLocation = isMobile && mode === "creating:pick";
  const isCreating = mode === "creating:pick" || mode === "creating:form";

  const editingVisit = editingId ? visits.find((v) => v.id === editingId) ?? null : null;
  const historyEntries = editingVisit ? getVisitHistoryEntries(editingVisit) : [];

  const handleListEdit = useCallback(
    (visit: SaunaVisit) => {
      startEditing(visit);
      if (isMobile) setSnapPosition("full");
    },
    [startEditing, isMobile, setSnapPosition],
  );

  const handleListSelectVisit = useCallback(
    (visit: SaunaVisit) => {
      handleSelectVisit(visit);
      if (isMobile) setSnapPosition("half");
    },
    [handleSelectVisit, isMobile, setSnapPosition],
  );

  const handleDeleteHistoryEntry = useCallback(
    (index: number) => {
      if (!editingId) return;

      removeHistoryEntry(editingId, index);

      const newLatest = historyEntries.filter((_, i) => i !== index).at(-1);

      if (newLatest) {
        setForm((prev) => ({
          ...prev,
          date: newLatest.date,
          comment: newLatest.comment,
          rating: newLatest.rating ?? 0,
          image: newLatest.image ?? "",
        }));
      }
    },
    [editingId, removeHistoryEntry, historyEntries],
  );

  const value: SaunaMapContextType = useMemo(
    () => ({
      isMobile,
      mounted,
      theme,
      toggleTheme,
      visits,
      filteredVisits,
      filters,
      setFilters,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
      exportVisits,
      form,
      setForm,
      editorState,
      mode,
      editingId,
      selectedLocation,
      isSidebarExpanded,
      isAdding,
      isMobilePickingLocation,
      isCreating,
      editingVisit,
      historyEntries,
      imageUploading,
      importing,
      importInputRef,
      startNewVisit,
      startEditing,
      handleDelete,
      confirmDelete,
      handleLocationSelect,
      handleBoundsChange,
      handleSubmit,
      handleImageFile,
      handleRemoveImage,
      handleImportData,
      handleDeleteHistoryEntry,
      cancelEditing,
      toggleSidebar,
      hoveredId,
      setHoveredId,
      selectedId,
      setSelectedId,
      activeMapTarget,
      snapPosition,
      setSnapPosition,
      handleZoomChange,
      enableClustering,
      toggleClustering,
      showBadges,
      selectedVisit: selectedVisit ?? null,
      handleSelectVisit,
      handleDeselectVisit,
      handleListEdit,
      handleListSelectVisit,
      handleSelectMobileTab,
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
      visits,
      filteredVisits,
      filters,
      setFilters,
      stats,
      isFilterActive,
      activeFilterCount,
      clearFilters,
      exportVisits,
      form,
      editorState,
      mode,
      editingId,
      selectedLocation,
      isSidebarExpanded,
      isAdding,
      isMobilePickingLocation,
      isCreating,
      editingVisit,
      historyEntries,
      imageUploading,
      importing,
      startNewVisit,
      startEditing,
      handleDelete,
      confirmDelete,
      handleLocationSelect,
      handleBoundsChange,
      handleSubmit,
      handleImageFile,
      handleRemoveImage,
      handleImportData,
      handleDeleteHistoryEntry,
      cancelEditing,
      toggleSidebar,
      hoveredId,
      setHoveredId,
      selectedId,
      setSelectedId,
      activeMapTarget,
      snapPosition,
      setSnapPosition,
      handleZoomChange,
      enableClustering,
      toggleClustering,
      showBadges,
      selectedVisit,
      handleSelectVisit,
      handleDeselectVisit,
      handleListEdit,
      handleListSelectVisit,
      handleSelectMobileTab,
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

  return <SaunaMapContext.Provider value={value}>{children}</SaunaMapContext.Provider>;
}

export function useSaunaMap() {
  const context = useContext(SaunaMapContext);
  if (!context) {
    throw new Error("useSaunaMap must be used within a SaunaMapProvider");
  }
  return context;
}
