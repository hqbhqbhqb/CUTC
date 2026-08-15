import {
  analyzeFrame,
  applyBrushCoverage,
  getPoseTorso,
} from "../src/lib/vision.js";

const width = 360;
const height = 240;

function makeImage(mode = "pale") {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const insideBack = x > 85 && x < 275 && y > 35 && y < 210;
      const includeBackSpots = mode !== "edge-only";
      const firstSpot = includeBackSpots && (x - 145) ** 2 + (y - 92) ** 2 < (mode === "subtle" ? 7 : 13) ** 2;
      const secondSpot = includeBackSpots && (x - 225) ** 2 + (y - 145) ** 2 < (mode === "subtle" ? 6 : 11) ** 2;
      const brightOutsideBackRoi = mode === "edge-only" && x > 88 && x < 102 && y > 55 && y < 190;
      let rgb = insideBack ? [180, 122, 102] : [245, 245, 235];
      if (firstSpot || secondSpot) {
        rgb = mode === "acne" ? [205, 78, 68] : mode === "subtle" ? [186, 132, 119] : [225, 198, 184];
      }
      if (brightOutsideBackRoi) rgb = [225, 198, 184];
      data.set([...rgb, 255], index);
    }
  }
  return { data };
}

function makePose(backFacing, visibility = 0.98) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
  landmarks[11] = { x: backFacing ? 0.28 : 0.72, y: 0.22, visibility };
  landmarks[12] = { x: backFacing ? 0.72 : 0.28, y: 0.22, visibility };
  landmarks[23] = { x: backFacing ? 0.36 : 0.64, y: 0.82, visibility };
  landmarks[24] = { x: backFacing ? 0.64 : 0.36, y: 0.82, visibility };
  return getPoseTorso(landmarks);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const noPerson = analyzeFrame(
  makeImage(),
  width,
  height,
  1,
  { personVisible: false, backFacing: false, polygon: null },
);
const frontFacing = analyzeFrame(makeImage(), width, height, 1, makePose(false));
const backPale = analyzeFrame(makeImage(), width, height, 1, makePose(true));
const subtlePale = analyzeFrame(makeImage("subtle"), width, height, 1.3, makePose(true));
const backAcne = analyzeFrame(makeImage("acne"), width, height, 1.3, makePose(true), "acne");
const brightBesideBack = analyzeFrame(makeImage("edge-only"), width, height, 1.3, makePose(true));
const lowerVisibilityPose = makePose(true, 0.48);

let target = {
  cells: [
    { x: 0.2, y: 0.2 }, { x: 0.24, y: 0.2 }, { x: 0.28, y: 0.2 },
    { x: 0.2, y: 0.24 }, { x: 0.24, y: 0.24 }, { x: 0.28, y: 0.24 },
  ],
  coveredCells: Array(6).fill(false),
  coverage: 0,
  contactMs: 0,
  motion: 0,
  completed: false,
};
for (let pass = 0; pass < 6; pass += 1) {
  for (const cell of target.cells) {
    target = applyBrushCoverage(target, cell, 300, 0.006, 0.018).target;
  }
}

assert(noPerson.spots.length === 0, "A bright scene without a person must not create targets.");
assert(frontFacing.spots.length === 0, "A front-facing person must not create back targets.");
assert(backPale.spots.length >= 2, "Pale back spots should be detected after pose confirmation.");
assert(subtlePale.spots.length >= 2, "Small, lower-contrast pale spots should survive the detailed scan.");
assert(backAcne.spots.length >= 2, "Red acne-like spots should be detected after pose confirmation.");
assert(brightBesideBack.spots.length === 0, "Bright skin-like regions beside the torso ROI must be rejected.");
assert(lowerVisibilityPose.backFacing, "Moderately occluded torso landmarks should still yield a back pose.");
assert(lowerVisibilityPose.polygon[0].x > 0.28, "The back ROI must contract inside the shoulder joints.");
assert(target.completed && target.coverage === 1, "Coverage must require the complete treatment path.");

console.log("Vision checks passed:", {
  noPersonTargets: noPerson.spots.length,
  frontFacingTargets: frontFacing.spots.length,
  paleTargets: backPale.spots.length,
  subtleTargets: subtlePale.spots.length,
  acneTargets: backAcne.spots.length,
  outsideBackTargets: brightBesideBack.spots.length,
  coverage: target.coverage,
});
