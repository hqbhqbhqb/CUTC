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

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint.y > y !== previousPoint.y > y &&
      x < ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) /
        (previousPoint.y - currentPoint.y || Number.EPSILON) + currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function scaleFromCenter(point, center, scaleX, offsetY = 0) {
  return {
    x: clamp(center.x + (point.x - center.x) * scaleX, 0.02, 0.98),
    y: clamp(point.y + offsetY, 0.02, 0.98),
  };
}

export function getPoseTorso(landmarks) {
  if (!landmarks?.length) {
    return { personVisible: false, backFacing: false, polygon: null };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const torsoLandmarks = [leftShoulder, rightShoulder, leftHip, rightHip];
  const visible = torsoLandmarks.every(
    (point) => point && (point.visibility ?? 1) >= 0.42 && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1,
  );
  if (!visible) return { personVisible: false, backFacing: false, polygon: null };

  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = hipY - shoulderY;
  const centered = Math.abs((leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4 - 0.5) < 0.34;
  const sizedCorrectly = shoulderWidth > 0.14 && hipWidth > 0.08 && torsoHeight > 0.17;
  const personVisible = centered && sizedCorrectly;

  // MediaPipe labels anatomical left/right. When the person's back faces the
  // unmirrored camera, their left shoulder appears on the image's left side.
  const backFacing = personVisible && leftShoulder.x + 0.012 < rightShoulder.x;
  if (!backFacing) return { personVisible, backFacing: false, polygon: null };

  // The UI mirrors the camera, so mirror pose x coordinates to match the
  // analysis canvas and overlay.
  const shoulders = [
    { x: 1 - leftShoulder.x, y: leftShoulder.y },
    { x: 1 - rightShoulder.x, y: rightShoulder.y },
  ].sort((a, b) => a.x - b.x);
  const hips = [
    { x: 1 - leftHip.x, y: leftHip.y },
    { x: 1 - rightHip.x, y: rightHip.y },
  ].sort((a, b) => a.x - b.x);
  const center = {
    x: (shoulders[0].x + shoulders[1].x + hips[0].x + hips[1].x) / 4,
    y: (shoulders[0].y + shoulders[1].y + hips[0].y + hips[1].y) / 4,
  };
  const displayTorsoHeight = (hips[0].y + hips[1].y - shoulders[0].y - shoulders[1].y) / 2;
  // Keep the detection ROI inside the shoulder/hip joints. Expanding the old
  // polygon made bright walls immediately beside the body look like lesions.
  const polygon = [
    scaleFromCenter(shoulders[0], center, 0.94, displayTorsoHeight * 0.025),
    scaleFromCenter(shoulders[1], center, 0.94, displayTorsoHeight * 0.025),
    scaleFromCenter(hips[1], center, 0.9, -displayTorsoHeight * 0.045),
    scaleFromCenter(hips[0], center, 0.9, -displayTorsoHeight * 0.045),
  ];

  return { personVisible, backFacing, polygon };
}

function isCandidate(stats, averages, threshold, condition) {
  const skinRange = stats.cb > 68 && stats.cb < 158 && stats.cr > 108 && stats.cr < 215;
  if (!skinRange) return false;

  if (condition === "acne") {
    return stats.cr > averages.cr + threshold * 0.55 && stats.luma > 38;
  }
  if (condition === "ringworm") {
    const redEdge = stats.cr > averages.cr + threshold * 0.65 && stats.luma > 38;
    const paleCenter = stats.spread < 58 && stats.luma > averages.luma + threshold;
    return redEdge || paleCenter;
  }
  const chromaDistance = Math.hypot(stats.cb - averages.cb, stats.cr - averages.cr);
  return stats.spread < 68 && chromaDistance < 34 && stats.luma > averages.luma + threshold;
}

export function analyzeFrame(
  imageData,
  width,
  height,
  sensitivity = 1,
  pose = { personVisible: false, backFacing: false, polygon: null },
  condition = "pityriasis",
) {
  const { data } = imageData;
  const step = width >= 560 ? 4 : 5;
  if (!pose.personVisible || !pose.backFacing || !pose.polygon) {
    return {
      backVisible: false,
      personVisible: pose.personVisible,
      backFacing: pose.backFacing,
      torsoPolygon: pose.polygon,
      skinRatio: 0,
      averageLuma: 0,
      spots: [],
    };
  }

  let skinCount = 0;
  let roiCount = 0;
  let lumaTotal = 0;
  let cbTotal = 0;
  let crTotal = 0;

  for (let y = step; y < height; y += step) {
    for (let x = step; x < width; x += step) {
      if (!pointInPolygon(x / width, y / height, pose.polygon)) continue;
      roiCount += 1;
      const [r, g, b] = getPixel(data, width, x, y);
      const stats = colorStats(r, g, b);
      const skinLike =
        stats.luma > 45 && stats.cb > 72 && stats.cb < 145 && stats.cr > 116 && stats.cr < 188;
      if (skinLike) {
        skinCount += 1;
        lumaTotal += stats.luma;
        cbTotal += stats.cb;
        crTotal += stats.cr;
      }
    }
  }

  const skinRatio = skinCount / Math.max(roiCount, 1);
  const averages = {
    luma: lumaTotal / Math.max(skinCount, 1),
    cb: cbTotal / Math.max(skinCount, 1),
    cr: crTotal / Math.max(skinCount, 1),
  };
  const backVisible = skinRatio > 0.34 && averages.luma > 45;
  if (!backVisible) {
    return {
      backVisible: false,
      personVisible: true,
      backFacing: true,
      torsoPolygon: pose.polygon,
      skinRatio,
      averageLuma: averages.luma,
      spots: [],
    };
  }

  const gridWidth = Math.ceil(width / step);
  const gridHeight = Math.ceil(height / step);
  const candidates = new Uint8Array(gridWidth * gridHeight);
  const skinMask = new Uint8Array(gridWidth * gridHeight);
  const statsGrid = new Array(gridWidth * gridHeight);
  const threshold = 5 + (1.5 - sensitivity) * 6;

  for (let gy = 1; gy < gridHeight - 1; gy += 1) {
    const y = Math.min(gy * step, height - 1);
    for (let gx = 1; gx < gridWidth - 1; gx += 1) {
      const x = Math.min(gx * step, width - 1);
      if (!pointInPolygon(x / width, y / height, pose.polygon)) continue;
      const stats = colorStats(...getPixel(data, width, x, y));
      const index = gy * gridWidth + gx;
      statsGrid[index] = stats;
      const chromaDistance = Math.hypot(stats.cb - averages.cb, stats.cr - averages.cr);
      if (
        stats.luma > 35 &&
        stats.cb > 68 && stats.cb < 158 &&
        stats.cr > 108 && stats.cr < 215 &&
        chromaDistance < 44
      ) skinMask[index] = 1;
    }
  }

  const integralWidth = gridWidth + 1;
  const integralSize = integralWidth * (gridHeight + 1);
  const integralCount = new Float64Array(integralSize);
  const integralLuma = new Float64Array(integralSize);
  const integralCb = new Float64Array(integralSize);
  const integralCr = new Float64Array(integralSize);
  for (let gy = 0; gy < gridHeight; gy += 1) {
    let rowCount = 0;
    let rowLuma = 0;
    let rowCb = 0;
    let rowCr = 0;
    for (let gx = 0; gx < gridWidth; gx += 1) {
      const gridIndex = gy * gridWidth + gx;
      const stats = statsGrid[gridIndex];
      if (skinMask[gridIndex] && stats) {
        rowCount += 1;
        rowLuma += stats.luma;
        rowCb += stats.cb;
        rowCr += stats.cr;
      }
      const integralIndex = (gy + 1) * integralWidth + gx + 1;
      const previousRowIndex = gy * integralWidth + gx + 1;
      integralCount[integralIndex] = integralCount[previousRowIndex] + rowCount;
      integralLuma[integralIndex] = integralLuma[previousRowIndex] + rowLuma;
      integralCb[integralIndex] = integralCb[previousRowIndex] + rowCb;
      integralCr[integralIndex] = integralCr[previousRowIndex] + rowCr;
    }
  }

  const rectangleSum = (integral, left, top, right, bottom) => {
    const x1 = clamp(left, 0, gridWidth);
    const y1 = clamp(top, 0, gridHeight);
    const x2 = clamp(right, 0, gridWidth);
    const y2 = clamp(bottom, 0, gridHeight);
    return integral[y2 * integralWidth + x2]
      - integral[y1 * integralWidth + x2]
      - integral[y2 * integralWidth + x1]
      + integral[y1 * integralWidth + x1];
  };

  for (let gy = 1; gy < gridHeight - 1; gy += 1) {
    for (let gx = 1; gx < gridWidth - 1; gx += 1) {
      const index = gy * gridWidth + gx;
      const stats = statsGrid[index];
      if (!stats || !skinMask[index]) continue;

      const outer = [gx - 4, gy - 4, gx + 5, gy + 5];
      const inner = [gx - 1, gy - 1, gx + 2, gy + 2];
      const localCount = rectangleSum(integralCount, ...outer) - rectangleSum(integralCount, ...inner);
      if (localCount < 12) continue;
      const localAverages = {
        luma: (rectangleSum(integralLuma, ...outer) - rectangleSum(integralLuma, ...inner)) / localCount,
        cb: (rectangleSum(integralCb, ...outer) - rectangleSum(integralCb, ...inner)) / localCount,
        cr: (rectangleSum(integralCr, ...outer) - rectangleSum(integralCr, ...inner)) / localCount,
      };
      if (isCandidate(stats, localAverages, threshold, condition)) candidates[index] = 1;
    }
  }

  const visited = new Uint8Array(candidates.length);
  const clusters = [];

  for (let index = 0; index < candidates.length; index += 1) {
    if (!candidates[index] || visited[index]) continue;
    const queue = [index];
    visited[index] = 1;
    const points = [];
    while (queue.length) {
      const current = queue.pop();
      points.push(current);
      const gx = current % gridWidth;
      const gy = Math.floor(current / gridWidth);
      const neighbors = [
        [gx - 1, gy],
        [gx + 1, gy],
        [gx, gy - 1],
        [gx, gy + 1],
      ];
      for (const [nextX, nextY] of neighbors) {
        if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) continue;
        const next = nextY * gridWidth + nextX;
        if (candidates[next] && !visited[next]) {
          visited[next] = 1;
          queue.push(next);
        }
      }
    }

    if (points.length < 2 || points.length > 600) continue;
    const xs = points.map((point) => point % gridWidth);
    const ys = points.map((point) => Math.floor(point / gridWidth));
    const centerX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const centerY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const spanX = Math.max(...xs) - Math.min(...xs) + 1;
    const spanY = Math.max(...ys) - Math.min(...ys) + 1;
    if (spanX / gridWidth > 0.24 || spanY / gridHeight > 0.24) continue;

    const cells = points.map((point) => ({
      x: ((point % gridWidth) * step) / width,
      y: (Math.floor(point / gridWidth) * step) / height,
    }));
    clusters.push({
      x: clamp((centerX * step) / width, 0, 1),
      y: clamp((centerY * step) / height, 0, 1),
      radiusX: clamp((spanX * step) / width / 2, 0.018, 0.12),
      radiusY: clamp((spanY * step) / height / 2, 0.018, 0.12),
      score: points.length,
      cells,
      coveredCells: Array(cells.length).fill(false),
      coverage: 0,
      contactMs: 0,
      motion: 0,
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

  return {
    backVisible,
    personVisible: true,
    backFacing: true,
    torsoPolygon: pose.polygon,
    skinRatio,
    averageLuma: averages.luma,
    spots,
  };
}

export function distance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getNextCoveragePoint(target, finger) {
  if (!target?.cells?.length) return target || null;
  const uncovered = target.cells.filter((_, index) => !target.coveredCells?.[index]);
  const origin = finger || { x: target.x, y: target.y };
  const candidates = uncovered.length ? uncovered : target.cells;
  return candidates.reduce((nearest, cell) =>
    distance(origin, cell) < distance(origin, nearest) ? cell : nearest,
  );
}

export function applyBrushCoverage(target, finger, deltaMs = 0, motionDelta = 0, brushRadius = 0.026) {
  if (!target?.cells?.length || !finger) {
    return { target, touching: false, justCompleted: false };
  }
  const coveredCells = [...(target.coveredCells || Array(target.cells.length).fill(false))];
  let touchingAnyCell = false;
  let touchingUncoveredCell = false;
  target.cells.forEach((cell, index) => {
    if (distance(cell, finger) <= brushRadius) {
      touchingAnyCell = true;
      if (!coveredCells[index]) touchingUncoveredCell = true;
      coveredCells[index] = true;
    }
  });
  const coveredCount = coveredCells.filter(Boolean).length;
  const coverage = coveredCount / target.cells.length;
  const contactMs = target.contactMs + (touchingAnyCell ? Math.min(deltaMs, 180) : 0);
  const motion = target.motion + (touchingAnyCell ? Math.min(motionDelta, 0.025) : 0);
  const completed = coverage >= 0.9 && contactMs >= 3000 && motion >= 0.018;
  const updated = {
    ...target,
    coveredCells,
    coverage,
    contactMs,
    motion,
    completed,
  };
  return {
    target: updated,
    // Resume voice guidance after a cell is covered so the user is directed
    // toward the remaining area instead of staying at the center.
    touching: touchingUncoveredCell || (coverage >= 0.9 && touchingAnyCell),
    justCompleted: completed && !target.completed,
  };
}

export function getDirection(finger, targetPoint) {
  if (!finger || !targetPoint) {
    return { key: "waiting", label: "Place your index finger in frame", arrows: [] };
  }
  const dx = targetPoint.x - finger.x;
  const dy = targetPoint.y - finger.y;
  const deadZone = 0.024;
  if (Math.hypot(dx, dy) < deadZone) {
    return { key: "apply", label: "Apply and rub gently here", arrows: ["•"] };
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { key: "right", label: "Move right", arrows: ["→", "→", "→"] }
      : { key: "left", label: "Move left", arrows: ["←", "←", "←"] };
  }
  return dy > 0
    ? { key: "down", label: "Move down", arrows: ["↓", "↓", "↓"] }
    : { key: "up", label: "Move up", arrows: ["↑", "↑", "↑"] };
}
