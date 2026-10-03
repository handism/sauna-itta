import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';
import packageJson from './package.json';

// 対応外の Node.js では、テストが原因の分かりにくい形で落ちる（Node 22 では jsdom の
// FileReader が Node 本体の Blob を受け付けず、写真のエクスポートのテストが失敗する）。
// 実行前に package.json の engines（.nvmrc と同じ版）と照合し、原因をそのまま伝える。
const requiredNodeMajor = Number(/\d+/.exec(packageJson.engines.node)?.[0]);
const currentNodeMajor = Number(process.versions.node.split('.')[0]);
if (currentNodeMajor < requiredNodeMajor) {
  throw new Error(
    `Node.js ${requiredNodeMajor} 以上でテストを実行してください（現在: ${process.versions.node}）。` +
      'リポジトリ直下の .nvmrc の版へ `nvm use` で切り替えられます。'
  );
}

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
