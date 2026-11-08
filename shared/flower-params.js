// Nonflowers (MIT, Lingdong Huang) parameter bridge: exposes the numbers inside genParams() as sliders.
// Shape functions (petal/leaf outlines, curves) stay as generated; everything numeric is editable.
(function () {
  const r = (key, label, min, max, step, get, set) => ({ key, label, type: 'range', min, max, step, get, set });
  const P = (k) => [(p) => p[k], (p, v) => { p[k] = v; }];
  const C = (k, side, i) => [(p) => p[k][side][i], (p, v) => { p[k][side][i] = v; }];
  const C2 = (k, i) => [(p) => p[k].min[i], (p, v) => { p[k].min[i] = v; p[k].max[i] = v; }];

  window.FLOWER_GROUPS = [
    { name: '꽃', items: [
      r('flowerHue0', '꽃 색상 (안쪽)', 0, 360, 1, ...C('flowerColor', 'min', 0)),
      r('flowerHue1', '꽃 색상 (끝)', 0, 360, 1, ...C('flowerColor', 'max', 0)),
      r('flowerSat0', '채도 (안쪽)', 0, 1, 0.01, ...C('flowerColor', 'min', 1)),
      r('flowerSat1', '채도 (끝)', 0, 1, 0.01, ...C('flowerColor', 'max', 1)),
      r('flowerVal0', '밝기 (안쪽)', 0.2, 1, 0.01, ...C('flowerColor', 'min', 2)),
      r('flowerVal1', '밝기 (끝)', 0.2, 1, 0.01, ...C('flowerColor', 'max', 2)),
      r('flowerLength', '꽃잎 길이', 5, 70, 1, ...P('flowerLength')),
      r('flowerWidth', '꽃잎 폭', 3, 40, 1, ...P('flowerWidth')),
      r('flowerPetal', '꽃잎 수', 2, 14, 1, ...P('flowerPetal')),
      r('pedicelLength', '꽃자루 길이', 0, 40, 1, ...P('pedicelLength')),
      r('flowerChance', '꽃 피는 빈도', 0, 0.15, 0.005, ...P('flowerChance')),
      r('innerLength', '꽃술 길이', 0, 30, 1, ...P('innerLength')),
      r('innerWidth', '꽃술 폭', 0, 10, 0.5, ...P('innerWidth')),
      r('innerHue', '꽃술 색상', 0, 360, 1, ...C2('innerColor', 0)),
    ]},
    { name: '잎', items: [
      r('leafHue0', '잎 색상 1', 0, 360, 1, ...C('leafColor', 'min', 0)),
      r('leafHue1', '잎 색상 2', 0, 360, 1, ...C('leafColor', 'max', 0)),
      r('leafSat', '잎 채도', 0, 0.8, 0.01, ...C2('leafColor', 1)),
      r('leafVal', '잎 밝기', 0.15, 0.95, 0.01, ...C2('leafColor', 2)),
      r('leafLength', '잎 길이', 10, 140, 1, ...P('leafLength')),
      r('leafWidth', '잎 폭', 2, 45, 1, ...P('leafWidth')),
      r('leafChance', '잎 빈도', 0, 0.2, 0.005, ...P('leafChance')),
      { key: 'leafPosition', label: '잎 위치 (초본)', type: 'select', numeric: true, options: [[1, '뿌리에서'], [2, '줄기를 따라']],
        get: (p) => p.leafPosition, set: (p, v) => { p.leafPosition = +v; } },
    ]},
    { name: '줄기 (초본)', items: [
      r('stemCount', '줄기 수', 1, 8, 1, ...P('stemCount')),
      r('stemLength', '줄기 길이', 120, 480, 5, ...P('stemLength')),
      r('stemWidth', '줄기 굵기', 1, 14, 0.5, ...P('stemWidth')),
      r('stemBend', '휘어짐', 0, 24, 0.5, ...P('stemBend')),
      r('sheathLength', '잎집 길이', 0, 120, 1, ...P('sheathLength')),
      r('shootCount', '곁가지 수', 0, 10, 1, ...P('shootCount')),
      r('shootLength', '곁가지 길이', 20, 220, 1, ...P('shootLength')),
    ]},
    { name: '가지 (목본)', items: [
      r('branchWidth', '가지 굵기', 0.2, 2, 0.05, ...P('branchWidth')),
      r('branchTwist', '비틀림', 1, 7, 1, ...P('branchTwist')),
      r('branchDepth', '가지 단계 (높을수록 느림)', 2, 5, 1, ...P('branchDepth')),
      r('branchFork', '갈래 수', 2, 9, 1, ...P('branchFork')),
      r('branchHue', '가지 색상', 0, 360, 1, ...C2('branchColor', 0)),
    ]},
  ];

  const ALL = () => FLOWER_GROUPS.flatMap((g) => g.items);
  window.flowerValuesFromPAR = (PAR) => Object.fromEntries(ALL().map((it) => [it.key, Math.round(it.get(PAR) * 1000) / 1000]));
  window.applyFlowerValues = (PAR, v) => { for (const it of ALL()) if (it.key in v) it.set(PAR, v[it.key]); return PAR; };
  window.FLOWER_KEYS = () => ALL().map((it) => it.key);

  // hsv (nonflowers style: h 0-360, s/v 0-1) → css hex
  window.hsvHex = function (h, s, v) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); v = Math.max(0, Math.min(1, v));
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b].map((t) => Math.round((t + m) * 255).toString(16).padStart(2, '0')).join('');
  };
})();
