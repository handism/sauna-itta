"use client";

import { useState } from "react";
import "leaflet/dist/leaflet.css";

import { ShareModal } from "./components/ShareModal";
import { VisitForm } from "./components/form/VisitForm";
import { VisitList } from "./components/list/VisitList";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { Toast } from "./components/common/Toast";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { BottomSheet } from "./components/BottomSheet";
import { MobileNavBar } from "./components/MobileNavBar";
import { DesktopSidebar } from "./components/DesktopSidebar";
import {
  SaunaMapProvider,
  useSaunaUI,
  useVisitFiltersContext,
  useSaunaEditorState,
  useSaunaEditorActions,
  useSaunaEditorForm,
  useSaunaMapState,
  useVisitsStatus,
  useVisitsActions,
} from "./context";
import { CurrentLocation } from "./types";
import { MobilePinHint } from "./components/map/MobilePinHint";
import { SaunaMapLayer } from "./components/map/SaunaMapLayer";
import { ApiAccessGate } from "./components/ApiAccessGate";
import { fillFormFromPlace } from "./utils/form";
import type { GeocodingResult } from "./utils/geocoding";
import { cx } from "./utils/classNames";

/**
 * モバイルの場所選択中の案内。地点検索で選んだときは、登録フォームの検索欄と同じく
 * サウナ名・エリアを補ってから場所を確定する（確定するとフォームへ進む）。
 * 入力中のフォーム値を購読するため、画面全体の親（SaunaMapContent）から切り離している。
 */
function MobileLocationPickHint({ onCancel }: { onCancel: () => void }) {
  const { handleLocationSelect } = useSaunaEditorActions();
  const { setForm } = useSaunaEditorForm();

  const handleSelectSearchResult = (result: GeocodingResult) => {
    setForm((prev) => fillFormFromPlace(prev, result));
    handleLocationSelect(result.lat, result.lng);
  };

  return <MobilePinHint onCancel={onCancel} onSelectSearchResult={handleSelectSearchResult} />;
}

function SaunaMapContent() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);

  const {
    isMobile,
    mounted,
    theme,
    isDeleteConfirmOpen,
    closeDeleteConfirm,
    toast,
    clearToast,
  } = useSaunaUI();

  const { filteredVisits } = useVisitFiltersContext();
  // 記録本体（useVisitsData）は購読しない。ここは画面全体の親なので、記録が 1 件変わる
  // たびに再レンダリングされると子の比較コストまで毎回かかる
  const { dataSource, loading, authenticated, csrfToken, loadError } = useVisitsStatus();
  const { reload } = useVisitsActions();

  const { isAdding, isCreating, isMobilePickingLocation, selectedLocation } = useSaunaEditorState();
  const { confirmDelete } = useSaunaEditorActions();

  const {
    snapPosition,
    setSnapPosition,
    selectedVisit,
    handleCancelEditing,
    handleSelectMobileTab,
  } = useSaunaMapState();

  if (!mounted) {
    return <div className="map-container" style={{ background: "var(--background)", height: "100%", width: "100%" }} />;
  }

  if (dataSource === "api" && (loading || !authenticated || loadError)) {
    return (
      <ApiAccessGate
        loading={loading}
        authenticated={authenticated}
        csrfToken={csrfToken}
        error={loadError}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className={cx("map-wrapper", theme === "light" && "light-theme")}>
      <SaunaMapLayer
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
      />

      {isMobilePickingLocation && (
        <MobileLocationPickHint onCancel={handleCancelEditing} />
      )}

      {/* デスクトップの新規登録は、場所を選ぶまで地図側にも次の手順を出す */}
      {!isMobile && isCreating && !selectedLocation && (
        <MobilePinHint variant="desktop" />
      )}

      {!isMobilePickingLocation && !isMobile && (
        <DesktopSidebar>
          {isAdding ? <VisitForm /> : <VisitList />}
        </DesktopSidebar>
      )}

      {/* モバイル専用 ボトムシート UI */}
      {!isMobilePickingLocation && isMobile && (
        <BottomSheet
          snapPosition={snapPosition}
          onSnapChange={setSnapPosition}
          filteredCount={filteredVisits.length}
          selectedVisitName={selectedVisit?.name}
        >
          {isAdding ? <VisitForm /> : <VisitList />}
        </BottomSheet>
      )}

      {/* モバイル専用 下部ナビゲーションバー */}
      {!isMobilePickingLocation && isMobile && (
        <MobileNavBar
          onSelectTab={handleSelectMobileTab}
          snapPosition={snapPosition}
          isAdding={isAdding}
        />
      )}

      <ShareModal />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="記録を削除しますか？"
        message="この操作は元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        destructive
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

export default function SaunaMap() {
  return (
    <ErrorBoundary>
      <SaunaMapProvider>
        <SaunaMapContent />
      </SaunaMapProvider>
    </ErrorBoundary>
  );
}
