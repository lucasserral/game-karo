import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Script universal robusto para procesar, recortar y generar spritesheets
 * sin cortar cabezas ni columnas, con eliminación precisa de fondo.
 *
 * Uso:
 *   node scripts/process-spritesheet.mjs [ruta_imagen] [nombre_salida]
 */
async function processSpritesheet() {
  const inputArg = process.argv[2] || 'src/assets/hero-walking.png';
  const outputName = process.argv[3] || 'hero';

  if (!fs.existsSync(inputArg)) {
    console.error(`❌ Error: No se encontró la imagen en "${inputArg}"`);
    process.exit(1);
  }

  console.log(`\n🔍 Procesando hoja de sprites: ${inputArg}`);
  const img = sharp(inputArg);
  const metadata = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`📐 Dimensiones: ${width}x${height} px, canales: ${channels}`);

  // 1. Detectar color de fondo analizando las 4 esquinas
  const corners = [
    0, // top-left
    (width - 1) * channels, // top-right
    ((height - 1) * width) * channels, // bottom-left
    ((height - 1) * width + width - 1) * channels // bottom-right
  ];

  let bgR = 0, bgG = 0, bgB = 0, hasAlpha = channels === 4;
  let transparentCorners = 0;

  for (const c of corners) {
    if (hasAlpha && data[c + 3] < 20) {
      transparentCorners++;
    } else {
      bgR += data[c];
      bgG += data[c + 1];
      bgB += data[c + 2];
    }
  }

  const isAlphaTransparent = transparentCorners >= 2;
  bgR = Math.round(bgR / Math.max(1, 4 - transparentCorners));
  bgG = Math.round(bgG / Math.max(1, 4 - transparentCorners));
  bgB = Math.round(bgB / Math.max(1, 4 - transparentCorners));

  console.log(`🎨 Fondo detectado: ${isAlphaTransparent ? 'Transparente (Alpha)' : `Color sólido rgb(${bgR}, ${bgG}, ${bgB})`}`);

  // Función para determinar si un píxel es fondo
  const isBg = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return true;
    const idx = (y * width + x) * channels;
    if (hasAlpha && data[idx + 3] < 20) return true;
    if (isAlphaTransparent) return false;

    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    // Distancia de color al fondo
    const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    return dist < 30 || (r > 240 && g > 240 && b > 240);
  };

  // 2. Histograma completo sin cortar bordes (x=0..width, y=0..height)
  const xHist = new Array(width).fill(0);
  const yHist = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isBg(x, y)) {
        xHist[x]++;
        yHist[y]++;
      }
    }
  }

  // 3. Segmentación de Columnas (filtrando posibles textos pequeños aislados)
  const rawCols = [];
  let inCol = false, colStart = 0;
  for (let x = 0; x < width; x++) {
    if (!inCol && xHist[x] > 4) {
      inCol = true;
      colStart = x;
    } else if (inCol && xHist[x] <= 4) {
      inCol = false;
      rawCols.push([colStart, x - 1]);
    }
  }
  if (inCol) rawCols.push([colStart, width - 1]);

  // Filtrar columnas espurias muy finas (< 25px) que podrían ser texto de margen
  const maxColWidth = Math.max(...rawCols.map(([s, e]) => e - s + 1));
  const validCols = rawCols.filter(([s, e]) => (e - s + 1) >= maxColWidth * 0.4);

  // 4. Segmentación de Filas
  const rawRows = [];
  let inRow = false, rowStart = 0;
  for (let y = 0; y < height; y++) {
    if (!inRow && yHist[y] > 4) {
      inRow = true;
      rowStart = y;
    } else if (inRow && yHist[y] <= 4) {
      inRow = false;
      rawRows.push([rowStart, y - 1]);
    }
  }
  if (inRow) rawRows.push([rowStart, height - 1]);

  const maxRowHeight = Math.max(...rawRows.map(([s, e]) => e - s + 1));
  const validRows = rawRows.filter(([s, e]) => (e - s + 1) >= maxRowHeight * 0.4);

  const numCols = validCols.length;
  const numRows = validRows.length;

  console.log(`✨ Grilla detectada: ${numCols} columnas × ${numRows} filas`);
  for (let c = 0; c < numCols; c++) {
    console.log(`  Col ${c}: x=${validCols[c][0]}..${validCols[c][1]} (ancho: ${validCols[c][1] - validCols[c][0] + 1}px)`);
  }
  for (let r = 0; r < numRows; r++) {
    console.log(`  Fila ${r}: y=${validRows[r][0]}..${validRows[r][1]} (alto: ${validRows[r][1] - validRows[r][0] + 1}px)`);
  }

  if (numCols === 0 || numRows === 0) {
    console.error('❌ Error: No se detectaron fotogramas en la imagen.');
    process.exit(1);
  }

  // 5. Medir fotogramas para celda uniforme
  let maxW = 0, maxH = 0;
  for (const [cs, ce] of validCols) {
    for (const [rs, re] of validRows) {
      let minX = ce, maxX = cs, minY = re, maxY = rs;
      for (let y = rs; y <= re; y++) {
        for (let x = cs; x <= ce; x++) {
          if (!isBg(x, y)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (minX <= maxX) {
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        if (w > maxW) maxW = w;
        if (h > maxH) maxH = h;
      }
    }
  }

  // Celda uniforme con margen
  const CELL_W = Math.ceil((maxW + 12) / 4) * 4;
  const CELL_H = Math.ceil((maxH + 12) / 4) * 4;

  const canvasWidth = numCols * CELL_W;
  const canvasHeight = numRows * CELL_H;
  const outBuffer = Buffer.alloc(canvasWidth * canvasHeight * 4, 0); // Transparente total

  console.log(`📏 Tamaño de cada celda ajustada: ${CELL_W}x${CELL_H} px`);

  // 6. Extracción y centrado por la base (pies)
  for (let r = 0; r < numRows; r++) {
    const [rs, re] = validRows[r];

    for (let c = 0; c < numCols; c++) {
      const [cs, ce] = validCols[c];

      // Encontrar bounding box exacto
      let minX = ce, maxX = cs, minY = re, maxY = rs;
      for (let y = rs; y <= re; y++) {
        for (let x = cs; x <= ce; x++) {
          if (!isBg(x, y)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY) continue;

      const charW = maxX - minX + 1;
      const charH = maxY - minY + 1;

      // Centrado horizontal, pies anclados cerca del fondo de la celda
      const destCellX = c * CELL_W;
      const destCellY = r * CELL_H;
      const destX = destCellX + Math.floor((CELL_W - charW) / 2);
      const destY = destCellY + (CELL_H - charH - 6);

      for (let cy = 0; cy < charH; cy++) {
        for (let cx = 0; cx < charW; cx++) {
          const srcX = minX + cx;
          const srcY = minY + cy;
          if (isBg(srcX, srcY)) continue;

          const srcIdx = (srcY * width + srcX) * channels;
          const outX = destX + cx;
          const outY = destY + cy;

          if (outX >= 0 && outX < canvasWidth && outY >= 0 && outY < canvasHeight) {
            const outIdx = (outY * canvasWidth + outX) * 4;
            outBuffer[outIdx]     = data[srcIdx];
            outBuffer[outIdx + 1] = data[srcIdx + 1];
            outBuffer[outIdx + 2] = data[srcIdx + 2];
            outBuffer[outIdx + 3] = hasAlpha ? data[srcIdx + 3] : 255;
          }
        }
      }
    }
  }

  // 7. Guardar en public/sprites/
  const outDir = 'public/sprites';
  fs.mkdirSync(outDir, { recursive: true });

  const fullPath = path.join(outDir, `${outputName}-full.png`);
  await sharp(outBuffer, {
    raw: { width: canvasWidth, height: canvasHeight, channels: 4 }
  }).png().toFile(fullPath);

  // Versión ajustada para canvas (64px de ancho por celda, altura proporcional)
  const targetCellW = 64;
  const targetCellH = Math.round(targetCellW * (CELL_H / CELL_W));
  const finalPath = path.join(outDir, `${outputName}.png`);

  await sharp(fullPath)
    .resize(numCols * targetCellW, numRows * targetCellH, {
      fit: 'fill',
      kernel: 'nearest' // Pixel-art nítido sin borrosidad
    })
    .png()
    .toFile(finalPath);

  // Leer direcciones existentes de hero.json si el usuario ya las definió
  const jsonPath = path.join(outDir, `${outputName}.json`);
  let directions = ['down', 'up', 'left', 'right']; // Default RPG Maker estándar
  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(existing.directions) && existing.directions.length === numRows) {
        directions = existing.directions;
      }
    } catch {
      // Ignorar si no es JSON válido
    }
  }

  const metaJson = {
    name: outputName,
    source: inputArg,
    cols: numCols,
    rows: numRows,
    totalFrames: numCols * numRows,
    frameWidth: targetCellW,
    frameHeight: targetCellH,
    directions,
    processedAt: new Date().toISOString()
  };

  fs.writeFileSync(jsonPath, JSON.stringify(metaJson, null, 2));

  console.log(`\n✅ ¡Spritesheet procesado con éxito!`);
  console.log(`📁 Maestro completo:    ${fullPath} (${canvasWidth}x${canvasHeight} px)`);
  console.log(`🎮 Para el juego:       ${finalPath} (${numCols * targetCellW}x${numRows * targetCellH} px, ${targetCellW}x${targetCellH} por celda)`);
  console.log(`🧭 Direcciones:         ${directions.join(' | ')}`);
  console.log(`📋 Metadatos:           ${jsonPath}\n`);
}

processSpritesheet().catch(console.error);
