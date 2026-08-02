import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

// 日付ユーティリティのテストは「UTC では前日になる時間帯でもローカル日付を返す」
// ことを検証するため、実行環境のタイムゾーンに依存する。ローカル (JST) では通り
// CI (UTC) では落ちる、という状態を防ぐためにここで固定する。
process.env.TZ = 'Asia/Tokyo';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
    environment: 'jsdom',
    env: {
      TZ: 'Asia/Tokyo'
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      // 現状の実測値をわずかに下回る値。テストを伴わない機能追加でここを下げないこと
      // （下げる場合は、なぜ検証できないのかを PR に書くこと）。
      thresholds: {
        statements: 84,
        branches: 73,
        functions: 83,
        lines: 86
      }
    }
  }
});
