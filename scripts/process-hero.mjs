import sharp from 'sharp';

async function main() {
  const inputPath = 'src/assets/hero-walking.png';
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's analyze vertical density for x >= 140 (ignoring left labels) and y >= 80 (ignoring top labels)
  const xProfile = new Array(width).fill(0);
  const yProfile = new Array(height).fill(0);

  for (let y = 80; y < height; y++) {
    for (let x = 140; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = data[idx + 3];
      if (alpha > 30) {
        xProfile[x]++;
        yProfile[y]++;
      }
    }
  }

  // Find column ranges
  const colRanges = [];
  let inCol = false;
  let startX = 0;
  for (let x = 140; x < width; x++) {
    if (!inCol && xProfile[x] > 10) {
      inCol = true;
      startX = x;
    } else if (inCol && xProfile[x] <= 10) {
      inCol = false;
      colRanges.push({ startX, endX: x, width: x - startX });
    }
  }
  if (inCol) colRanges.push({ startX, endX: width, width: width - startX });

  // Find row ranges
  const rowRanges = [];
  let inRow = false;
  let startY = 0;
  for (let y = 80; y < height; y++) {
    if (!inRow && yProfile[y] > 10) {
      inRow = true;
      startY = y;
    } else if (inRow && yProfile[y] <= 10) {
      inRow = false;
      rowRanges.push({ startY, endY: y, height: y - startY });
    }
  }
  if (inRow) rowRanges.push({ startY, endY: height, height: height - startY });

  console.log('Columns detected (count =', colRanges.length, '):', colRanges);
  console.log('Rows detected (count =', rowRanges.length, '):', rowRanges);
}

main().catch(console.error);
