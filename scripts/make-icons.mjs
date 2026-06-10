// public/icon.svg → electron/icon.ico (+ electron/icon.png).
// electron-builder 가 이 아이콘으로 Windows 실행 파일·창·설치 마법사 아이콘을 만든다.
// SVG 를 바꾸면 다시 실행:  node scripts/make-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon.svg"));
const sizes = [16, 24, 32, 48, 64, 128, 256];

const pngs = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()),
);

// ICO 조립 — 각 엔트리는 PNG 로 인코딩(Windows Vista+ 지원).
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4); // image count

const dir = Buffer.alloc(16 * sizes.length);
let offset = 6 + 16 * sizes.length;
sizes.forEach((size, i) => {
  const e = i * 16;
  dir.writeUInt8(size >= 256 ? 0 : size, e + 0); // width (0 = 256)
  dir.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
  dir.writeUInt8(0, e + 2); // color palette count
  dir.writeUInt8(0, e + 3); // reserved
  dir.writeUInt16LE(1, e + 4); // color planes
  dir.writeUInt16LE(32, e + 6); // bits per pixel
  dir.writeUInt32LE(pngs[i].length, e + 8); // image data size
  dir.writeUInt32LE(offset, e + 12); // image data offset
  offset += pngs[i].length;
});

const ico = Buffer.concat([header, dir, ...pngs]);
mkdirSync(join(root, "electron"), { recursive: true });
writeFileSync(join(root, "electron", "icon.ico"), ico);
writeFileSync(
  join(root, "electron", "icon.png"),
  await sharp(svg).resize(512, 512).png().toBuffer(),
);
console.log(
  `electron/icon.ico (${ico.length} bytes, ${sizes.length} sizes) + electron/icon.png 생성 완료`,
);
