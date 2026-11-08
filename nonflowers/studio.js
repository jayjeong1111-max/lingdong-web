// Parameter panel for Nonflowers (added for this site; main.js is unchanged).
// Replaces generate() so the plant is drawn from an editable PAR object.
(function () {
  const DEFAULTS = { plantType: 'auto', frame: 3, paperTone: 1 };
  const V = readQuery(DEFAULTS);
  const FKEYS = FLOWER_KEYS();
  const q0 = new URLSearchParams(location.search);
  const overrides = {};
  for (const k of FKEYS) if (q0.has(k) && isFinite(+q0.get(k))) overrides[k] = +q0.get(k);

  let PAR = null, isWoody = false, panel = null, drawCount = 0;

  function paperCol() { const t = V.paperTone; return [0.98, 0.91 + (0.99 - 0.91) * (1 - t) , 0.74 + (0.9 - 0.74) * (1 - t)]; }

  function draw() {
    CTX = Layer.empty();
    CTX.fillStyle = 'white';
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
    const ppr = paper({ col: paperCol() });
    for (let i = 0; i < CTX.canvas.width; i += 512) for (let j = 0; j < CTX.canvas.height; j += 512) CTX.drawImage(ppr, i, j);
    return ppr;
  }

  // same random sequence as the original generate(), so a seed gives the same flower as before
  window.generate = function () {
    draw();
    const coin = Math.random() <= 0.5;
    PAR = genParams();
    isWoody = V.plantType === 'auto' ? coin : V.plantType === 'woody';
    applyFlowerValues(PAR, overrides);
    plant();
    if (!panel) buildPanel();
  };

  function plant() {
    if (isWoody) woody({ ctx: CTX, xof: 300, yof: 550, PAR });
    else herbal({ ctx: CTX, xof: 300, yof: 600, PAR });
    CTX.globalCompositeOperation = 'source-over';
    if (V.frame > 0) Layer.border(CTX, squircle(0.98, V.frame));
  }

  function redraw() {
    panel.busy('다시 그리는 중…');
    setTimeout(() => {
      Math.seed(SEED + '#' + (++drawCount));
      const old = CTX.canvas;
      draw();
      plant();
      old.replaceWith(CTX.canvas);
      panel.busy('');
    }, 30);
  }

  function persist() {
    writeQuery(Object.assign({ seed: SEED }, V), DEFAULTS);
    const q = new URLSearchParams(location.search);
    for (const k of FKEYS) { if (k in overrides) q.set(k, overrides[k]); else q.delete(k); }
    history.replaceState(null, '', location.pathname + '?' + q.toString());
  }

  function buildPanel() {
    panel = makePanel({
      title: 'Nonflowers · 파라미터',
      values: Object.assign({ seed: SEED }, V, flowerValuesFromPAR(PAR)),
      groups: [
        { name: '기본', hint: '슬라이더를 놓으면 같은 꽃 종을 다시 그립니다 (배치는 매번 조금씩 달라져요).', items: [
          { key: 'seed', label: '시드', type: 'text' },
          { key: 'plantType', label: '형태', type: 'select', options: [['auto', '시드대로'], ['herbal', '초본 (풀꽃)'], ['woody', '목본 (나무꽃)']] },
          { key: 'frame', label: '액자 모양 (0 = 사각)', type: 'range', min: 0, max: 8, step: 0.5 },
          { key: 'paperTone', label: '종이 누런 정도', type: 'range', min: 0, max: 1, step: 0.01 },
        ]},
        ...FLOWER_GROUPS,
      ],
      onChange(key, val, all, final) {
        if (key === 'seed') return;
        if (!final && key !== 'plantType') return;
        if (FKEYS.includes(key)) { overrides[key] = val; applyFlowerValues(PAR, { [key]: val }); }
        else V[key] = val;
        if (key === 'plantType') isWoody = val === 'auto' ? isWoody : val === 'woody';
        persist(); redraw();
      },
      actions: [
        { label: '다시 그리기', primary: true, onClick: redraw },
        { label: '이 시드로', onClick: (v) => { location.href = location.pathname + '?seed=' + encodeURIComponent(v.seed || Date.now()); } },
        { label: '무작위 새 꽃', onClick: () => { location.href = location.pathname + '?seed=' + Date.now(); } },
        { label: '기본값으로', onClick: () => { location.href = location.pathname + '?seed=' + encodeURIComponent(SEED); } },
      ],
      credit: '원작: <a href="https://github.com/LingDong-/nonflowers">Nonflowers</a> · Lingdong Huang · MIT<br><a href="../">← 山水·非花</a>',
    });
    persist();
  }
})();
