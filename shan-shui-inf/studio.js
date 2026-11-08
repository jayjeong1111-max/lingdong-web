// Parameter panel for {Shan, Shui}* (added for this site).
// Layout values (SS, read in index.html) need a regenerate; ink/paper values apply live.
(function () {
  const GEN = { mountThresh: 0.55, mountSpread: 500, mountHeight: 1, mountWidth: 1, veg: true,
                boatChance: 0.2, flatChance: 0.01, distEvery: 1000 };
  const LOOK = { inkContrast: 1, inkBright: 1, sepia: 0, bleed: 0, soften: 0, warm: 0 };
  const DEFAULTS = Object.assign({}, GEN, LOOK);
  const V = readQuery(DEFAULTS);
  V.seed = SEED;

  const st = document.createElement('style');
  document.head.appendChild(st);
  function applyLook() {
    document.getElementById('inkbleed-disp').setAttribute('scale', V.bleed);
    document.getElementById('inkbleed-blur').setAttribute('stdDeviation', V.soften);
    const f = [];
    if (V.bleed > 0 || V.soften > 0) f.push('url(#inkbleed)');
    f.push(`contrast(${V.inkContrast})`, `brightness(${V.inkBright})`, `sepia(${V.sepia})`);
    if (V.warm) f.push(`hue-rotate(${-V.warm}deg) saturate(${1 + V.warm / 30})`);
    st.textContent = `#BG svg{filter:${f.join(' ')}}`;
  }
  applyLook();

  let dirty = false;
  const panel = makePanel({
    title: '{山, 水}* · 파라미터',
    values: V,
    groups: [
      { name: '시드', items: [{ key: 'seed', label: '시드', type: 'text' }] },
      { name: '산 배치 (다시 그리기 필요)', hint: '바꾼 뒤 아래 “이 설정으로 다시 그리기”를 누르세요.', items: [
        { key: 'mountThresh', label: '산 문턱 (낮을수록 산이 많음)', type: 'range', min: 0.3, max: 0.75, step: 0.01 },
        { key: 'mountSpread', label: '산 흩어짐', type: 'range', min: 0, max: 1500, step: 10 },
        { key: 'mountHeight', label: '산 높이', type: 'range', min: 0.3, max: 2.2, step: 0.05 },
        { key: 'mountWidth', label: '산 폭', type: 'range', min: 0.4, max: 2.2, step: 0.05 },
        { key: 'veg', label: '산에 나무 그리기', type: 'check' },
        { key: 'distEvery', label: '먼 산 간격', type: 'range', min: 200, max: 4000, step: 100 },
        { key: 'flatChance', label: '평평한 언덕 빈도', type: 'range', min: 0, max: 0.06, step: 0.002 },
        { key: 'boatChance', label: '배 빈도', type: 'range', min: 0, max: 0.8, step: 0.01 },
      ]},
      { name: '먹 · 종이 (바로 적용)', items: [
        { key: 'inkContrast', label: '먹 대비', type: 'range', min: 0.4, max: 2.5, step: 0.05 },
        { key: 'inkBright', label: '밝기', type: 'range', min: 0.5, max: 1.4, step: 0.01 },
        { key: 'sepia', label: '세피아 (오래된 종이)', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'warm', label: '색 온도', type: 'range', min: 0, max: 40, step: 1 },
        { key: 'bleed', label: '먹 번짐 (일렁임)', type: 'range', min: 0, max: 25, step: 0.5 },
        { key: 'soften', label: '부드럽게 (흐림)', type: 'range', min: 0, max: 3, step: 0.1 },
      ]},
    ],
    onChange(key, val, all, final) {
      V[key] = val;
      if (key in LOOK) { applyLook(); if (final) writeQuery(pick(), DEFAULTS); return; }
      if (key in GEN) { dirty = true; panel.busy('“이 설정으로 다시 그리기”를 누르면 적용돼요.'); }
    },
    actions: [
      { label: '이 설정으로 다시 그리기', primary: true, onClick: () => writeQuery(pick(), DEFAULTS, true) },
      { label: '무작위 새 산수', onClick: () => { V.seed = String(Date.now()); writeQuery(pick(), DEFAULTS, true); } },
      { label: '기본값으로', onClick: () => { location.href = location.pathname + '?seed=' + encodeURIComponent(SEED); } },
    ],
    credit: '원작: <a href="https://github.com/LingDong-/shan-shui-inf">{Shan, Shui}*</a> · Lingdong Huang · MIT<br>왼쪽 위 ☰ 메뉴는 원작의 보기·저장 메뉴입니다. <a href="../">← 山水·非花</a>',
  });
  function pick() { const o = { seed: V.seed }; for (const k in DEFAULTS) o[k] = V[k]; return o; }
})();
