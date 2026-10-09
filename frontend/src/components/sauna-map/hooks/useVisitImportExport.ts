import { useState, useRef, useCallback, type ChangeEvent } from "react";
import type { SaunaVisit } from "../types";
import { toUserMessage, type ImportResult } from "../repositories";
import type { ShowToast } from "../components/common/Toast";
import { ImportFileError, ImportProgressError, type BatchImportResult } from "../utils/visitImport";
import { downloadVisitsAsJson, importVisitsFromFile as importFile } from "../services/visitImportExport";

const RELOAD_FAILED_NOTE = "（画面の再読み込みに失敗したため、表示が最新でない可能性があります）";
const EXPORT_FAILED_FALLBACK = "エクスポートに失敗しました。";

/**
 * @param getVisits 画面に表示中の記録を返す関数。重複判定とエクスポートの時点で読む
 *   （配列を直接受け取ると、返す操作関数が記録の変化ごとに作り直される）
 * @param importBatch Repository の importBatch。両モードともこれが唯一の保存経路のため必須。
 *   「Repository を通さず visits 配列を丸ごと保存する」引数を足し戻さないこと
 *   （localモードでも Repository 経由に統一されています。frontend/AGENTS.md 参照）。
 * @param prepareExport Repository の prepareExport。apiモードの写真を data URL へ置き換える。
 *   省略可能にしたり記録をそのまま書き出したりすると、apiモードのエクスポートから写真が抜ける。
 */
export function useVisitImportExport(
  getVisits: () => SaunaVisit[],
  importBatch: (visits: SaunaVisit[]) => Promise<ImportResult>,
  prepareExport: (visits: SaunaVisit[]) => Promise<SaunaVisit[]>,
  reload: () => Promise<boolean>,
  showToast?: ShowToast,
) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const importVisitsFromFile = useCallback(
    async (file: File): Promise<BatchImportResult> => {
      return importFile(file, getVisits, importBatch, reload, (added, total) => {
        showToast?.(`${added}/${total}件を取り込み中です...`, "info");
      });
    },
    [getVisits, importBatch, reload, showToast],
  );

  const handleImportData = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const { added, skipped, reloaded, droppedImages } = await importVisitsFromFile(file);
        const reloadNote = reloaded ? "" : RELOAD_FAILED_NOTE;
        if (added === 0) {
          showToast?.(
            (skipped > 0
              ? `${skipped}件はすでに登録済みのため、新しく追加されたデータはありません。`
              : "新しく追加されるデータはありませんでした。") + reloadNote,
            "info",
          );
          return;
        }

        const skippedNote = skipped > 0 ? `（${skipped}件はすでに登録済みのためスキップしました）` : "";
        const droppedNote =
          droppedImages > 0
            ? `（写真${droppedImages}枚は画像URLとして書き出されていたため取り込めませんでした。最新の版でエクスポートし直してください）`
            : "";
        showToast?.(`データを${added}件取り込みました。${skippedNote}${droppedNote}${reloadNote}`, "success");
      } catch (error) {
        if (error instanceof ImportProgressError) {
          const progress = error.added > 0 ? `${error.added}件は取り込み済みです。` : "";
          showToast?.(`データの取り込みに失敗しました。${progress}${error.message}`, "error");
        } else if (error instanceof ImportFileError) {
          showToast?.(error.message, "error");
        } else {
          // 取り込みサービスは上の 2 種類で投げるため、ここへ来るのは想定外の誤りだけ
          console.error("Unexpected import failure:", error);
          showToast?.("データの取り込みに失敗しました。", "error");
        }
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importVisitsFromFile, showToast],
  );

  const exportVisits = useCallback(async () => {
    setExporting(true);
    try {
      downloadVisitsAsJson(await prepareExport(getVisits()));
    } catch (error) {
      showToast?.(toUserMessage(error, EXPORT_FAILED_FALLBACK), "error");
    } finally {
      setExporting(false);
    }
  }, [getVisits, prepareExport, showToast]);

  return {
    importing,
    exporting,
    importInputRef,
    handleImportData,
    importVisitsFromFile,
    exportVisits,
  };
}
