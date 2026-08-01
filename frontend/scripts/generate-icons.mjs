/**
 * PWAアイコン生成スクリプト
 *
 * src/app/icon.svg を各サイズのPNGアイコンに変換する。
 * sharp を使用してSVGからPNGへの変換を行う。
 *
 * 使い方: npx tsx scripts/generate-icons.mjs
 * (sharp がインストール済みであること)
 *
 * 生成ファイル:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-192.png
 *   public/icons/icon-maskable-512.png
 *   public/icons/apple-icon.png
 */

import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outDir = join(projectRoot, "public", "icons");
mkdirSync(outDir, { recursive: true });

// 元のSVGを読み込む (32x32 viewBox)
const svgContent = readFileSync(
  join(projectRoot, "src", "app", "icon.svg"),
  "utf-8"
);

// SVGの背景色 (manifest.jsonの background_color と揃える)
const BG_COLOR = "#0f172a";

/**
 * 通常アイコン: SVGをリサイズし、背景色付きで描画
 */
async function generateIcon(size, filename) {
  // SVGのviewBoxを拡大
  const scaledSvg = svgContent.replace(
    /width="32" height="32"/,
    `width="${size}" height="${size}"`
  );

  const icon = await sharp(Buffer.from(scaledSvg))
    .resize(size, size)
    .flatten({ background: BG_COLOR })
    .png()
    .toBuffer();

  const filePath = join(outDir, filename);
  await sharp(icon).toFile(filePath);
  console.log(`✅ Generated: ${filePath} (${size}x${size})`);
}

/**
 * Maskableアイコン: セーフゾーン (中心80%) に収めて背景色で余白を埋める
 */
async function generateMaskableIcon(size, filename) {
  const innerSize = Math.round(size * 0.7); // 70%に縮小 (セーフゾーン考慮)

  const scaledSvg = svgContent.replace(
    /width="32" height="32"/,
    `width="${innerSize}" height="${innerSize}"`
  );

  const innerIcon = await sharp(Buffer.from(scaledSvg))
    .resize(innerSize, innerSize)
    .flatten({ background: BG_COLOR })
    .png()
    .toBuffer();

  // 背景キャンバスに中央配置
  const padding = Math.round((size - innerSize) / 2);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: innerIcon, left: padding, top: padding }])
    .png()
    .toFile(join(outDir, filename));

  console.log(`✅ Generated: ${join(outDir, filename)} (${size}x${size}, maskable)`);
}

// アイコン生成
async function main() {
  await generateIcon(192, "icon-192.png");
  await generateIcon(512, "icon-512.png");
  await generateIcon(180, "apple-icon.png");
  await generateMaskableIcon(192, "icon-maskable-192.png");
  await generateMaskableIcon(512, "icon-maskable-512.png");
  console.log("\n🎉 All PWA icons generated successfully!");
}

main().catch((err) => {
  console.error("❌ Icon generation failed:", err);
  process.exit(1);
});
