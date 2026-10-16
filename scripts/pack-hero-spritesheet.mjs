import sharp from 'sharp';
import fs from 'fs';

async function main() {
  const inputPath = 'src/assets/hero-walking.png';
  const img = sharp(inputPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Exact 8 columns
  const colCenters = [
    (172 + 284) / 2,
    (339 + 446) / 2,
    (500 + 613) / 2,
    (675 + 782) / 2,
    (846 + 952) / 2,
    (1014 + 1121) / 2,
    (1183 + 1289) / 2,
    (1358 + 1468) / 2,
  ];

  // Exact 4 rows: Row 0 = Right, Row 1 = Left, Row 2 = Down, Row 3 = Up
  const rows = [
    { name: 'right', startY: 105, endY: 288 },
    { name: 'left',  startY: 327, endY: 519 },
    { name: 'down',  startY: 569, endY: 759 },
    { name: 'up',    startY: 786, endY: 980 },
  ];

  // Standard frame dimension:
  // Character width max ~115, height ~194
  // Let's create cells of 128 x 208 for high-res master, and scale to 64 x 64 for pixel-crisp game engine!
  const CELL_W = 128;
  const CELL_H = 208;
  const OUT_COLS = 8;
  const OUT_ROWS = 4;

  const canvasWidth = OUT_COLS * CELL_W;   // 1024 px
  const canvasHeight = OUT_ROWS * CELL_H;  // 832 px
  const outBuffer = Buffer.alloc(canvasWidth * canvasHeight * 4, 0); // Transparent RGBA

  for (let r = 0; r < OUT_ROWS; r++) {
    const rowInfo = rows[r];
    const rowH = rowInfo.endY - rowInfo.startY;

    for (let c = 0; c < OUT_COLS; c++) {
      const colX = colCenters[c];

      // Find precise bounding box of this single character to center it perfectly
      const searchLeft = Math.floor(colX - 70);
      const searchRight = Math.ceil(colX + 70);
      let minX = searchRight, maxX = searchLeft;
      let minY = rowInfo.endY, maxY = rowInfo.startY;

      for (let y = rowInfo.startY; y <= rowInfo.endY; y++) {
        for (let x = searchLeft; x <= searchRight; x++) {
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const idx = (y * width + x) * channels;
          if (data[idx + 3] > 20) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY) {
        console.warn(`Frame empty at r=${r}, c=${c}`);
        continue;
      }

      const charW = maxX - minX + 1;
      const charH = maxY - minY + 1;

      // Center character horizontally in cell, align feet to bottom - 10px
      const destCellX = c * CELL_W;
      const destCellY = r * CELL_H;

      const destX = destCellX + Math.floor((CELL_W - charW) / 2);
      const destY = destCellY + (CELL_H - charH - 12);

      // Copy pixels
      for (let cy = 0; cy < charH; cy++) {
        for (let cx = 0; cx < charW; cx++) {
          const srcX = minX + cx;
          const srcY = minY + cy;
          const srcIdx = (srcY * width + srcX) * channels;

          const outX = destX + cx;
          const outY = destY + cy;
          const outIdx = (outY * canvasWidth + outX) * 4;

          outBuffer[outIdx]     = data[srcIdx];
          outBuffer[outIdx + 1] = data[srcIdx + 1];
          outBuffer[outIdx + 2] = data[srcIdx + 2];
          outBuffer[outIdx + 3] = data[srcIdx + 3];
        }
      }
    }
  }

  // Ensure public/sprites exists
  fs.mkdirSync('public/sprites', { recursive: true });

  // Save full master spritesheet
  await sharp(outBuffer, {
    raw: { width: canvasWidth, height: canvasHeight, channels: 4 }
  }).png().toFile('public/sprites/hero-full.png');
  console.log('Saved public/sprites/hero-full.png (1024x832)');

  // Also create a normalized game-ready spritesheet: 8 cols x 4 rows, 64x104 per cell (512x416)
  await sharp('public/sprites/hero-full.png')
    .resize(OUT_COLS * 64, OUT_ROWS * 104, {
      fit: 'fill',
      kernel: 'lanczos3'
    })
    .png()
    .toFile('public/sprites/hero.png');

  console.log('Saved public/sprites/hero.png (512x416, 64x104 per frame, 8 frames x 4 directions)');
}

main().catch(console.error);
