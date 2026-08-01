import { defineConfig } from 'vitest/config';
import path from 'path';

// 日付ユーティリティのテストは「UTC では前日になる時間帯でもローカル日付を返す」
// ことを検証するため、実行環境のタイムゾーンに依存する。ローカル (JST) では通り
// CI (UTC) では落ちる、という状態を防ぐためにここで固定する。
process.env.TZ = 'Asia/Tokyo';

export default defineConfig({
  test: {
    environment: 'jsdom',
    env: {
      TZ: 'Asia/Tokyo'
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
