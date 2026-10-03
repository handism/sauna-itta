import apiLimits from "./apiLimits.json";

/*
 * Rails API と揃える必要のある上限値。値は apiLimits.json を唯一の出所とし、
 * Rails 側の定数（ImportsController::MAX_BATCH_SIZE、VisitHistoryEntry::MAX_IMAGE_BYTES・
 * ALLOWED_IMAGE_TYPES）との一致を backend/test/contract/frontend_api_limits_test.rb が検査する。
 * ここや呼び出し側へ数値を書き写さないこと（片側だけ変えると、apiモードで保存・取り込みが
 * サーバーに弾かれて初めて食い違いに気付くことになる）。
 */

/** インポートの 1 リクエストあたりの記録数の上限 */
export const IMPORT_MAX_BATCH_SIZE: number = apiLimits.importMaxBatchSize;

/** 写真 1 枚の復号後のバイト数の上限 */
export const MAX_IMAGE_BYTES: number = apiLimits.maxImageBytes;

/** アップロードを受け付ける画像の MIME タイプ（利用側は image.ts の ALLOWED_IMAGE_MIME_TYPES を使う） */
export const API_ALLOWED_IMAGE_MIME_TYPES: readonly string[] = apiLimits.allowedImageMimeTypes;
