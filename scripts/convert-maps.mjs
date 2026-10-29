import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const mapsDir = path.resolve('public/maps');

async function convertFile(file, options = {}) {
  const inputPath = path.join(mapsDir, file);
  if (!fs.existsSync(inputPath)) return;

  const baseName = path.basename(file, path.extname(file));
  const outputPath = path.join(mapsDir, `${baseName}.webp`);

  const meta = await sharp(inputPath).metadata();
  console.log(`Converting ${file} (${meta.width}x${meta.height}, ${meta.format}) -> ${baseName}.webp...`);

  await sharp(inputPath)
    .webp(options)
    .toFile(outputPath);

  const outStat = fs.statSync(outputPath);
  console.log(`✓ Generated ${baseName}.webp (${(outStat.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('🔄 Converting PNG maps in public/maps to WebP...');

  // 1. Base Map (background)
  await convertFile('estate-map.png', { quality: 92 });

  // 2. Foreground Layer (transparent overhead canopy)
  await convertFile('estate-foreground.png', { lossless: true });

  // 3. Collision Mask (binary mask)
  await convertFile('estate-collision.png', { lossless: true });

  console.log('✨ All maps successfully converted to WebP!');
}

main().catch((err) => {
  console.error('Error converting maps:', err);
  process.exit(1);
});
