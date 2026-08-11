const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function getPixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

function colorStats(r, g, b) {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { luma, cb, cr, spread: Math.max(r, g, b) - Math.min(r, g, b) };
}

export function analyzeFrame(imageData, width, height, sensitivity = 1) {
  const { data } = imageData;
  const step = 5;
  let skinCount = 0;
  let roiCount = 0;
  let lumaTotal = 0;

  for (let y = step; y < height; y += step) {
    for (let x = step; x < width; x += step) {
      const nx = (x / width - 0.5) / 0.35;
      const ny = (y / height - 0.52) / 0.46;
      if (nx * nx + ny * ny > 1) continue;
      roiCount += 1;
      const [r, g, b] = getPixel(data, width, x, y);
      const stats = colorStats(r, g, b);
      const skinLike =
        stats.luma > 45 && stats.cb > 72 && stats.cb < 142 && stats.cr > 120 && stats.cr < 185;
      if (skinLike) {
        skinCount += 1;
        lumaTotal += stats.luma;
      }
    }
  }

  const skinRatio = skinCount / Math.max(roiCount, 1);
  const averageLuma = lumaTotal / Math.max(skinCount, 1);
  const backVisible = skinRatio > 0.22 && averageLuma > 55;
  if (!backVisible) return { backVisible: false, skinRatio, spots: [] };

  const gridWidth = Math.ceil(width / step);
  const gridHeight = Math.ceil(height / step);
  const candidates = new Uint8Array(gridWidth * gridHeight);
  const threshold = 13 + (1.5 - sensitivity) * 12;

  for (let gy = 1; gy < gridHeight - 1; gy += 1) {
    const y = Math.min(gy * step, height - 1);
    for (let gx = 1; gx < gridWidth - 1; gx += 1) {
      const x = Math.min(gx * step, width - 1);
      const nx = (x / width - 0.5) / 0.35;
      const ny = (y / height - 0.52) / 0.46;
      if (nx * nx + ny * ny > 1) continue;
      const [r, g, b] = getPixel(data, width, x, y);
      const stats = colorStats(r, g, b);
      const pale = stats.spread < 52 && stats.luma > averageLuma + threshold;
      const skinRange = stats.cb > 72 && stats.cb < 150 && stats.cr > 112 && stats.cr < 188;
      if (pale && skinRange) candidates[gy * gridWidth + gx] = 1;
    }
  }

  const visited = new Uint8Array(candidates.length);
  const clusters = [];
  const neighborOffsets = [-1, 1, -gridWidth, gridWidth];

  for (let index = 0; index < candidates.length; index += 1) {
    if (!candidates[index] || visited[index]) continue;
    const queue = [index];
    visited[index] = 1;
    const points = [];
    while (queue.length) {
      const current = queue.pop();
      points.push(current);
      for (const offset of neighborOffsets) {
        const next = current + offset;
        if (next >= 0 && next < candidates.length && candidates[next] && !visited[next]) {
          visited[next] = 1;
          queue.push(next);
        }
      }
    }
    if (points.length < 2 || points.length > 150) continue;
    const xs = points.map((point) => point % gridWidth);
    const ys = points.map((point) => Math.floor(point / gridWidth));
    const centerX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const centerY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const spanX = Math.max(...xs) - Math.min(...xs) + 1;
    const spanY = Math.max(...ys) - Math.min(...ys) + 1;
    if (spanX / gridWidth > 0.2 || spanY / gridHeight > 0.2) continue;
    clusters.push({
      x: clamp((centerX * step) / width, 0, 1),
      y: clamp((centerY * step) / height, 0, 1),
      radius: clamp(Math.max(spanX * step / width, spanY * step / height) * 0.65, 0.025, 0.065),
      score: points.length,
    });
  }

  const spots = clusters
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .sort((a, b) => {
      const aSide = a.x < 0.5 ? 0 : 1;
      const bSide = b.x < 0.5 ? 0 : 1;
      return aSide - bSide || a.y - b.y;
    })
    .map((spot, index) => ({ ...spot, id: index + 1, completed: false }));

  return { backVisible, skinRatio, spots };
}

export function distance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getDirection(finger, target) {
  if (!finger || !target) return { key: "waiting", label: "Đưa ngón trỏ vào khung hình", arrows: [] };
  const dx = target.x - finger.x;
  const dy = target.y - finger.y;
  const deadZone = 0.04;
  if (Math.hypot(dx, dy) < deadZone) return { key: "hold", label: "Giữ và xoa nhẹ", arrows: ["•"] };
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { key: "right", label: "Sang phải", arrows: ["→", "→", "→"] }
      : { key: "left", label: "Sang trái", arrows: ["←", "←", "←"] };
  }
  return dy > 0
    ? { key: "down", label: "Xuống dưới", arrows: ["↓", "↓", "↓"] }
    : { key: "up", label: "Lên trên", arrows: ["↑", "↑", "↑"] };
}
