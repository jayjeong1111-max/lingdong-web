// horsedraw — procedurally generated line-drawn horses.
// Written for this site (not part of LingDong's code). Output: polylines → SVG.
// usage: const {polylines, w, h} = horsedraw({ seed, build, pose, coat, mane, wobble });
(function (root) {
  // ---------- seeded random + value noise ----------
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }

  function horsedraw(opt) {
    opt = opt || {};
    const seedStr = String(opt.seed == null ? Date.now() : opt.seed);
    let R = mulberry(hashStr(seedStr));
    // each part draws from its own random stream, so the same seed gives the same horse in every animation frame
    const reseed = (tag) => { R = mulberry(hashStr(seedStr + '|' + tag)); };
    const phase = ((+opt.phase || 0) % 1 + 1) % 1, TAU = Math.PI * 2;
    const rnd = (a, b) => a + (b - a) * R();
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const nseed = R() * 1000;
    const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + nseed) * 43758.5453; return s - Math.floor(s); };
    const sm = (t) => t * t * (3 - 2 * t);
    function noise(x, y) {
      y = y || 0; const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
      const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    }

    // ---------- geometry helpers ----------
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
    const mul = (a, k) => [a[0] * k, a[1] * k];
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const down = (th) => [Math.sin(th), Math.cos(th)];          // angle from straight down, + = forward (+x)

    function spline(pts, closed, seg) {                          // Catmull-Rom
      seg = seg || 10; const n = pts.length, out = [];
      const P = (i) => closed ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        for (let j = 0; j < seg; j++) {
          const t = j / seg, t2 = t * t, t3 = t2 * t;
          out.push([
            0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
        }
      }
      if (!closed) out.push(pts[n - 1].slice()); else out.push(out[0].slice());
      return out;
    }
    function resample(pl, step) {
      const out = [pl[0]]; let acc = 0;
      for (let i = 1; i < pl.length; i++) {
        let a = pl[i - 1], b = pl[i], d = dist(a, b);
        while (acc + d >= step) { const t = (step - acc) / d; a = lerp(a, b, t); out.push(a); d = dist(a, b); acc = 0; }
        acc += d;
      }
      out.push(pl[pl.length - 1]); return out;
    }
    function inPoly(p, poly) {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    }
    // keep only the parts of a polyline for which keep(point) is true
    function clip(pl, keep) {
      const out = []; let cur = [];
      for (const p of pl) { if (keep(p)) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } }
      if (cur.length > 1) out.push(cur); return out;
    }
    function bbox(poly) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return [x0, y0, x1, y1]; }

    // ---------- parameters ----------
    const BUILDS = {
      light: { depth: 0.44, leg: 1.12, thick: 0.85, neck: 1.08, head: 0.95, belly: 0.96 },   // 경주마
      stock: { depth: 0.50, leg: 1.00, thick: 1.00, neck: 1.00, head: 1.00, belly: 1.02 },   // 보통
      draft: { depth: 0.58, leg: 0.92, thick: 1.45, neck: 0.88, head: 1.08, belly: 1.10 },   // 짐말
      pony:  { depth: 0.56, leg: 0.74, thick: 1.15, neck: 0.80, head: 1.20, belly: 1.12 },   // 조랑말
      foal:  { depth: 0.40, leg: 1.30, thick: 0.72, neck: 0.85, head: 1.12, belly: 0.92 },   // 망아지
    };
    const pb_ = pick(['light', 'stock', 'stock', 'draft', 'pony', 'foal']);
    const buildName = BUILDS[opt.build] ? opt.build : pb_;
    const B = BUILDS[buildName];
    const pp_ = pick(['stand', 'stand', 'walk', 'walk', 'trot', 'gallop', 'rear', 'graze']);
    const poseName = ['stand', 'walk', 'trot', 'gallop', 'rear', 'graze', 'run'].includes(opt.pose) ? opt.pose : pp_;
    const run = poseName === 'run';
    const pc_ = pick(['plain', 'shade', 'shade', 'pinto', 'dapple', 'zebra']);
    const coatName = ['plain', 'shade', 'pinto', 'dapple', 'zebra'].includes(opt.coat) ? opt.coat : pc_;
    const pm_ = rnd(0.3, 1.3);
    const maneLen = opt.mane == null ? pm_ : +opt.mane;
    const wobble = opt.wobble == null ? 1 : +opt.wobble;

    const L = buildName === 'foal' ? 150 : buildName === 'pony' ? 185 : 210;   // withers → hip
    const D = L * B.depth * rnd(0.94, 1.06);                                   // chest depth
    const TH = B.thick * rnd(0.92, 1.1);
    const moving = run || poseName === 'trot' || poseName === 'gallop' ? 1 : poseName === 'walk' ? 0.4 : poseName === 'rear' ? 0.7 : 0;
    const j = (a) => rnd(-a, a);

    reseed('pose');
    let rot = 0, neckA = rnd(0.55, 0.85), headA = rnd(0.95, 1.25), bob = 0;
    if (poseName === 'rear') { rot = -rnd(0.55, 0.8); neckA = rnd(0.9, 1.2); headA = rnd(1.2, 1.5); }
    if (poseName === 'graze') { neckA = rnd(2.0, 2.25); headA = rnd(1.25, 1.45); }
    if (poseName === 'gallop') { neckA = rnd(1.0, 1.2); headA = rnd(0.6, 0.85); rot = j(0.06); }
    if (poseName === 'trot') { neckA = rnd(0.5, 0.75); headA = rnd(1.15, 1.4); }
    if (run) { rot = 0.07 * Math.sin(TAU * phase + 0.6); neckA = 1.05 + 0.1 * Math.sin(TAU * phase + 2.2); headA = 0.78 + 0.07 * Math.sin(TAU * phase + 1.2); bob = -6 * Math.sin(TAU * phase + 2.6); }
    const neckLen = L * 0.56 * B.neck * rnd(0.92, 1.08);
    const headLen = L * 0.43 * B.head * rnd(0.94, 1.06);
    const sway = rnd(0.4, 1.6), crest = rnd(0.05, 0.16) * (buildName === 'draft' ? 1.5 : 1), dish = rnd(-0.03, 0.035);

    // body frame: withers at (0,0), hip at (-L,0), facing +x; rotated about the hip for rearing
    const HIP = [-L, 0];
    const T = (p) => { const x = p[0] - HIP[0], y = p[1] - HIP[1], c = Math.cos(rot), s = Math.sin(rot); return [HIP[0] + x * c - y * s, HIP[1] + x * s + y * c + bob]; };
    const bp = (x, y) => T([x * L, y * D]);

    // ---------- body + neck + head contour (one closed line) ----------
    const nd = [Math.sin(neckA), -Math.cos(neckA)];               // neck direction (withers → poll)
    const nn = [-nd[1], nd[0]];                                   // neck normal (toward throat side)
    const W0 = [0, -0.04 * D];
    const poll = add(W0, mul(nd, neckLen));
    const u = [Math.cos(headA), Math.sin(headA)], v = [-u[1], u[0]];
    let hp = (s, t) => add(poll, add(mul(u, s * headLen), mul(v, t * headLen)));
    const jowl = hp(0.30, 0.43), throat = hp(0.10, 0.40);
    const nThick = 0.30 * L * Math.sqrt(TH);
    const chestF = [0.16 * L, 0.42 * D];

    const contour = [
      [-1.09 * L, 0.14 * D], [-1.0 * L, -0.02 * D], [-0.86 * L, -0.085 * D], [-0.62 * L, -0.02 * D],
      [-0.34 * L, 0.035 * D * sway], [-0.12 * L, -0.01 * D], W0,
      add(add(W0, mul(nd, neckLen * 0.33)), mul(nn, -crest * neckLen * 0.55)),
      add(add(W0, mul(nd, neckLen * 0.68)), mul(nn, -crest * neckLen)),
      add(add(W0, mul(nd, neckLen * 0.93)), mul(nn, -crest * neckLen * 0.35)),
      hp(0, -0.02), hp(0.25, -0.045), hp(0.6, -0.03 + dish), hp(0.9, -0.005), hp(1.0, 0.07), hp(0.985, 0.19), hp(0.88, 0.245),
      hp(0.62, 0.25), jowl, throat,
      lerp(throat, chestF, 0.35).map((c, i) => c + nn[i] * nThick * -0.02),
      lerp(throat, chestF, 0.72).map((c, i) => c + nn[i] * nThick * 0.10),
      chestF, [0.13 * L, 0.74 * D], [0.02 * L, 0.98 * D], [-0.2 * L, 1.03 * D],
      [-0.5 * L, 1.03 * D * B.belly], [-0.74 * L, 0.93 * D], [-0.86 * L, 0.80 * D], [-0.99 * L, 0.86 * D],
      [-1.11 * L, 0.62 * D], [-1.14 * L, 0.36 * D],
    ].map(T);
    const bodyPoly = spline(contour, true, 12);

    // ---------- legs ----------
    const lw = (k) => k * L * TH;
    // chain: joints [[x,y],...], widths per joint → {left, right, poly}
    function limb(js, ws) {
      const dense = spline(js, false, 8), n = dense.length, Lp = [], Rp = [];
      for (let i = 0; i < n; i++) {
        const a = dense[Math.max(0, i - 1)], b = dense[Math.min(n - 1, i + 1)];
        const d = dist(a, b) || 1, nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d;
        const f = i / (n - 1) * (ws.length - 1), k = Math.min(ws.length - 2, Math.floor(f)), t = sm(f - k);
        const w = ws[k] + (ws[k + 1] - ws[k]) * t;
        Lp.push([dense[i][0] + nx * w, dense[i][1] + ny * w]); Rp.push([dense[i][0] - nx * w, dense[i][1] - ny * w]);
      }
      return { left: Lp, right: Rp, poly: Lp.concat(Rp.slice().reverse()) };
    }
    function hoofShape(F, th, size) {            // F = bottom of pastern, th = pastern angle
      const d = down(th), n = [d[1], -d[0]], s = size;
      const top1 = add(F, mul(n, s * 0.55)), top2 = add(F, mul(n, -s * 0.55));
      const tip = add(F, mul(d, s * 0.95));
      const b1 = add(tip, mul(n, s * 0.95)), b2 = add(tip, mul(n, -s * 0.7));
      return [top2, b2, b1, top1];
    }

    const groundY = T([0, 0])[1] * 0 + (1.0 * D + L * 0.70 * B.leg);       // ground level under a standing horse
    function foreLeg(far, a) {     // a = [forearm, cannon, pastern] angles
      const off = far ? [0.06 * L, -0.015 * L] : [0, 0];
      const S = add(bp(0.02, 0.50), off), E = add(bp(-0.035, 0.90), off);
      const fore = L * 0.34 * B.leg, pas = L * 0.085, hs = lw(0.052);
      const K = add(E, mul(down(a[0]), fore));
      let can = L * 0.26 * B.leg;
      if (a.plant) { const need = (groundY - hs * 0.95 * Math.cos(a[2]) - pas * Math.cos(a[2]) - K[1]) / Math.cos(a[1]); can = Math.max(can * 0.55, Math.min(can * 1.6, need)); }
      const F = add(K, mul(down(a[1]), can)), P = add(F, mul(down(a[2]), pas));
      const lm = limb([S, lerp(S, E, 0.6), E, lerp(E, K, 0.45), lerp(E, K, 0.88), K, lerp(K, F, 0.14), lerp(K, F, 0.55), lerp(K, F, 0.9), F, P],
        [0.13, 0.105, 0.082, 0.066, 0.043, 0.047, 0.034, 0.03, 0.031, 0.04, 0.034].map(lw));
      return { lm, hoof: hoofShape(P, a[2], hs * 1.05), skip: 0.17, far };
    }
    function hindLeg(far, a) {     // a = [thigh, gaskin, cannon, pastern]
      const off = far ? [0.085 * L, -0.02 * L] : [0, 0];
      const Hj = add(bp(-0.93, 0.34), off);
      const St = add(Hj, mul(down(a[0]), 0.55 * D + 0.06 * L));
      const gas = L * 0.33 * B.leg, pas = L * 0.09, hs = lw(0.052);
      const Hk = add(St, mul(down(a[1]), gas));
      let can = L * 0.30 * B.leg;
      if (a.plant) { const need = (groundY - hs * 0.95 * Math.cos(a[3]) - pas * Math.cos(a[3]) - Hk[1]) / Math.cos(a[2]); can = Math.max(can * 0.55, Math.min(can * 1.6, need)); }
      const F = add(Hk, mul(down(a[2]), can)), P = add(F, mul(down(a[3]), pas));
      const lm = limb([Hj, lerp(Hj, St, 0.55), St, lerp(St, Hk, 0.4), lerp(St, Hk, 0.85), Hk, lerp(Hk, F, 0.15), lerp(Hk, F, 0.55), lerp(Hk, F, 0.9), F, P],
        [0.17, 0.155, 0.125, 0.085, 0.05, 0.052, 0.04, 0.033, 0.033, 0.042, 0.035].map(lw));
      return { lm, hoof: hoofShape(P, a[3], hs * 1.05), skip: 0.3, far };
    }
    const pl = (arr) => { arr.plant = true; return arr; };
    let fN, fF, hN, hF;
    reseed('legs');
    // periodic interpolation through evenly spaced key poses
    const cyc = (keys, t) => {
      t = ((t % 1) + 1) % 1; const n = keys.length, f = t * n, i = Math.floor(f), u_ = f - i, K = (k) => keys[((k % n) + n) % n];
      return K(i).map((_, d) => { const p0 = K(i - 1)[d], p1 = K(i)[d], p2 = K(i + 1)[d], p3 = K(i + 2)[d]; return 0.5 * (2 * p1 + (-p0 + p2) * u_ + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u_ * u_ + (-p0 + 3 * p1 - 3 * p2 + p3) * u_ * u_ * u_); });
    };
    const FORE = [[0.8, 0.55, 0.6], [0.05, 0.0, 0.55], [-0.6, -0.5, 0.15], [-0.15, -1.45, -1.2], [0.9, -0.85, -0.9]];           // reach, stance, push, lift, fold
    const HIND = [[1.0, -0.1, 0.5, 0.7], [0.5, -0.55, 0.05, 0.55], [0.2, -1.15, -0.85, -0.2], [0.45, -1.0, -1.5, -1.3], [0.9, -0.3, -0.6, -0.4]];
    if (run) { hN = cyc(HIND, phase); hF = cyc(HIND, phase - 0.1); fF = cyc(FORE, phase - 0.45); fN = cyc(FORE, phase - 0.55); } else
    if (poseName === 'stand' || poseName === 'graze') {
      const g = poseName === 'graze' ? 0.12 : 0;
      fN = pl([j(0.07) + g, j(0.04), 0.5]); fF = pl([j(0.1) - g * 1.5, j(0.04), 0.5]);
      hN = pl([0.5, -0.5 + j(0.06), 0.06 + j(0.04), 0.55]); hF = pl([0.5, -0.38 + j(0.08), 0.02 + j(0.05), 0.55]);
      if (R() < 0.3) hF = [0.55, -0.25, -0.35, -0.5];             // resting a hind leg
    } else if (poseName === 'walk') {
      fN = pl([0.32 + j(0.06), 0.14, 0.45]); fF = [-0.12 + j(0.08), -0.75 + j(0.1), -0.9];
      hN = pl([0.42, -0.72 + j(0.05), -0.22, 0.35]); hF = pl([0.68, -0.2 + j(0.06), 0.22, 0.6]);
    } else if (poseName === 'trot') {
      fN = [0.75 + j(0.1), -0.75 + j(0.1), -1.0]; fF = pl([-0.3 + j(0.05), -0.22, 0.25]);
      hN = pl([0.4, -0.85 + j(0.05), -0.3, 0.2]); hF = [0.95 + j(0.06), -0.3 + j(0.1), 0.55, 0.9];
    } else if (poseName === 'gallop') {
      fN = [1.15 + j(0.1), 0.75 + j(0.15), 0.9]; fF = [0.85 + j(0.1), 0.2 + j(0.2), -0.2];
      hN = [0.25, -1.2 + j(0.1), -0.95 + j(0.1), -0.3]; hF = [0.35, -1.0 + j(0.1), -0.6 + j(0.15), -0.9];
    } else {                                                      // rear
      fN = [1.0 + j(0.15), -0.7 + j(0.2), -0.9]; fF = [1.35 + j(0.15), -0.2 + j(0.25), -0.7];
      hN = pl([0.5, -0.75 + j(0.05), 0.12, 0.6]); hF = pl([0.62, -0.55 + j(0.08), 0.2, 0.6]);
    }
    const legs = { fN: foreLeg(false, fN), hN: hindLeg(false, hN), fF: foreLeg(true, fF), hF: hindLeg(true, hF) };

    // ---------- assemble with hidden-line removal ----------
    const lines = [];                              // {pl, w}
    const push = (p, w) => { if (p.length > 1) lines.push({ pl: p, w: w || 1 }); };
    // the whole near-leg shape hides the body line, even its undrawn top: that leaves the little gap at the chest/neck the sketch is liked for
    const nearPolys = [legs.fN.lm.poly, legs.hN.lm.poly, legs.fN.hoof, legs.hN.hoof];
    const frontOf = (polys) => (p) => !polys.some((q) => inPoly(p, q));

    function drawLeg(lg, masks) {
      const keep = frontOf(masks);
      for (const side of [lg.lm.left, lg.lm.right]) {
        const k0 = Math.floor(side.length * lg.skip);
        const s = resample(side.filter((p, i) => i >= k0 || !inPoly(p, bodyPoly)), 2);
        clip(s, keep).forEach((c) => push(c, lg.far ? 0.85 : 1));
      }
      const hf = resample(lg.hoof.concat([lg.hoof[0]]), 2);
      clip(hf, keep).forEach((c) => push(c, 1));
      // hoof hatching
      const [x0, y0, x1, y1] = bbox(lg.hoof);
      for (let x = x0 - (y1 - y0); x < x1; x += 2.2) {
        const h = resample([[x, y0], [x + (y1 - y0), y1]], 1.5);
        clip(h, (p) => inPoly(p, lg.hoof) && keep(p)).forEach((c) => push(c, 0.7));
      }
    }
    // far legs: hidden by the body and by the near legs
    drawLeg(legs.fF, [bodyPoly].concat(nearPolys));
    drawLeg(legs.hF, [bodyPoly].concat(nearPolys));
    // far legs get a light hatch so they sit back
    for (const lg of [legs.fF, legs.hF]) {
      const k0 = Math.floor(lg.lm.left.length * lg.skip), vis = lg.lm.left.slice(k0).concat(lg.lm.right.slice(k0).reverse());
      const [x0, y0, x1, y1] = bbox(vis), keep = frontOf([bodyPoly].concat(nearPolys));
      for (let y = y0 - (x1 - x0) * 0.35; y < y1; y += 4.5) {
        const h = resample([[x0, y], [x1, y + (x1 - x0) * 0.35]], 2);
        clip(h, (p) => inPoly(p, vis) && keep(p)).forEach((c) => push(c, 0.55));
      }
    }
    // body contour: hidden where the near legs pass in front
    clip(resample(bodyPoly, 2), frontOf(nearPolys)).forEach((c) => push(c, 1.25));
    drawLeg(legs.fN, []); drawLeg(legs.hN, []);

    // ---------- face ----------
    reseed('face');
    const hpRaw = hp; { const c = Math.cos(rot), s = Math.sin(rot); const ru = [u[0] * c - u[1] * s, u[0] * s + u[1] * c]; u[0] = ru[0]; u[1] = ru[1]; v[0] = -u[1]; v[1] = u[0]; }
    const pollT = T(poll);
    hp = (s, t) => add(pollT, add(mul(u, s * headLen), mul(v, t * headLen)));
    const eye = hp(0.27, 0.115), es = headLen * 0.05;
    push(spline([add(eye, mul(u, -es)), add(eye, mul(v, -es * 0.55)), add(eye, mul(u, es)), add(eye, mul(v, es * 0.45))], true, 6), 1);
    push(spline([add(eye, mul(u, -es * 0.3)), add(eye, mul(v, -es * 0.3)), add(eye, mul(u, es * 0.4)), add(eye, mul(v, es * 0.3))], true, 4), 1.6);
    push(spline([hp(0.9, 0.05), hp(0.935, 0.075), hp(0.925, 0.115), hp(0.895, 0.105)], false, 6), 1);
    push(spline([hp(0.99, 0.175), hp(0.93, 0.165), hp(0.85, 0.185)], false, 6), 0.9);
    push(spline([hp(0.2, 0.2), hp(0.33, 0.33), hp(0.5, 0.27)], false, 6), 0.7);                 // cheek
    const earL = headLen * rnd(0.17, 0.24), ea = rnd(-0.35, 0.25) - (moving > 0.5 ? 0.5 : 0);
    const ed = [-u[0] * Math.cos(ea) + v[0] * -Math.sin(ea) - v[0] * 0.75, -u[1] * Math.cos(ea) + v[1] * -Math.sin(ea) - v[1] * 0.75];
    const edn = Math.hypot(ed[0], ed[1]), e1 = [ed[0] / edn, ed[1] / edn], e2 = [-e1[1], e1[0]];
    for (const [base, k] of [[hp(0.03, -0.02), 1], [hp(0.075, -0.035), 0.85]]) {
      const tip = add(base, mul(e1, earL * k));
      const ear = spline([add(base, mul(e2, -earL * 0.2)), add(lerp(base, tip, 0.5), mul(e2, -earL * 0.26)), tip, add(lerp(base, tip, 0.5), mul(e2, earL * 0.2)), add(base, mul(e2, earL * 0.2))], false, 6);
      clip(resample(ear, 2), k === 1 ? () => true : (p) => !inPoly(p, bodyPoly)).forEach((c) => push(c, 1));
    }

    // ---------- muscle hints ----------
    const hint = (pts, w) => clip(resample(spline(pts, false, 8), 2), (p) => inPoly(p, bodyPoly)).forEach((c) => push(c, w || 0.7));
    hint([bp(0.06, 0.2), bp(0.1, 0.45), bp(0.03, 0.72)]);                         // shoulder
    hint([bp(-0.72, 0.2), bp(-0.66, 0.5), bp(-0.74, 0.8)]);                       // flank
    if (R() < 0.6) hint([bp(-0.3, 0.75), bp(-0.5, 0.85), bp(-0.68, 0.8)], 0.5);   // ribs/belly

    // ---------- coat ----------
    reseed('coat');
    const allNear = [bodyPoly];
    const onHorse = (p) => inPoly(p, bodyPoly);
    const [bx0, by0, bx1, by1] = bbox(bodyPoly);
    if (coatName === 'shade' || coatName === 'pinto') {
      const sc = coatName === 'pinto' ? 0.011 : 0.02, thr = coatName === 'pinto' ? rnd(0.5, 0.6) : 0;
      const gap = coatName === 'pinto' ? 3.2 : 4.2;
      for (let o = bx0 - (by1 - by0); o < bx1; o += gap) {
        const h = resample([[o, by0], [o + (by1 - by0) * 0.8, by1]], 2);
        const keep = coatName === 'pinto'
          ? (p) => onHorse(p) && noise(p[0] * sc, p[1] * sc) > thr
          : (p) => { if (!onHorse(p)) return false; const q = T([0, 0]); const dy = (p[1] - q[1]) / D; return dy > 0.55 + noise(p[0] * sc, p[1] * sc) * 0.5 && noise(p[0] * 0.05, p[1] * 0.3 + 9) > 0.3; };
        clip(h, keep).forEach((c) => push(c, 0.6));
      }
    } else if (coatName === 'dapple') {
      for (let i = 0; i < 90; i++) {
        const c = bp(rnd(-1.12, 0.2), rnd(-0.1, 1.05)), r = rnd(3, 7);
        if (!onHorse(c)) continue;
        const ring = []; const a0 = R() * 6.28, span = rnd(3.5, 5.8);
        for (let a = 0; a <= span; a += 0.35) ring.push([c[0] + Math.cos(a0 + a) * r, c[1] + Math.sin(a0 + a) * r * 0.85]);
        clip(resample(ring, 1.5), onHorse).forEach((s) => push(s, 0.6));
      }
    } else if (coatName === 'zebra') {
      const stripe = (a, b, bend) => {
        const m = lerp(a, b, 0.5), d = [b[0] - a[0], b[1] - a[1]], n = [-d[1] * bend, d[0] * bend];
        for (const k of [-1.3, 0, 1.3]) {
          const s = spline([add(a, [k, 0]), add(add(m, n), [k * 1.6, 0]), add(b, [k, 0])], false, 10);
          clip(resample(s, 2), onHorse).forEach((c) => push(c, 0.8));
        }
      };
      for (let x = -1.1; x < 0.15; x += rnd(0.06, 0.085)) stripe(bp(x + j(0.02), -0.3), bp(x - 0.08 + j(0.03), 1.2), 0.1);
      for (let t = 0.08; t < 0.98; t += 0.085) {                                   // neck
        const c = add(W0, mul(nd, neckLen * t)); stripe(T(add(c, mul(nn, -nThick))), T(add(c, mul(nn, nThick * 1.6))), 0.1);
      }
      for (const lg of [legs.fN, legs.hN]) {                                       // near legs
        const n = lg.lm.left.length;
        for (let i = Math.floor(n * 0.3); i < n - 4; i += 5) push(resample([lg.lm.left[i], lg.lm.right[i]], 2), 0.8);
      }
    }

    // ---------- mane, forelock, tail ----------
    reseed('hair');
    const blow = moving * rnd(0.6, 1.1);
    function hair(root, dir, len, curl, w) {
      const pts = [root]; let p = root, a = Math.atan2(dir[1], dir[0]);
      const n = 9, fq = rnd(0.5, 1.5), ph = R() * 9;
      for (let i = 1; i <= n; i++) { a += curl / n + (noise(i * fq + ph, ph) - 0.5) * 0.55 + (run ? 0.13 * Math.sin(TAU * phase - i * 0.75 + ph) : 0); p = add(p, [Math.cos(a) * len / n, Math.sin(a) * len / n]); pts.push(p); }
      push(resample(spline(pts, false, 5), 2), w || 0.8);
      return pts;
    }
    const TW = (p) => T(p);
    const crestPt = (t) => TW(add(add(W0, mul(nd, neckLen * t)), mul(nn, -crest * neckLen * Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.95)));
    const mLen = neckLen * 0.42 * maneLen;
    const maneRoots = [], maneTips = [], tailPts = [];
    if (maneLen > 0.05) {
      const count = Math.round(34 + maneLen * 26);
      for (let i = 0; i < count; i++) {
        const t = 0.04 + 0.95 * i / count + j(0.01);
        const base = crestPt(t);
        let hp_;
        if (maneLen < 0.3) hp_ = hair(base, [-Math.cos(neckA + rot) * 0.2 - blow * 0.3, -1], mLen * rnd(0.8, 1.6) + 4, j(0.3), 0.8);        // roached
        else hp_ = hair(base, [-0.25 - blow * 1.6, 1 - blow * 0.55], mLen * rnd(0.6, 1.15) * (0.6 + 0.6 * Math.sin(Math.PI * t)), j(0.5) - blow * 0.5, 0.8);
        maneRoots.push(base); maneTips.push(hp_[hp_.length - 1]);
      }
      for (let i = 0; i < 9; i++) hair(hp(0.02 + i * 0.012, -0.03), [u[0] * 0.8 - blow * 0.6, u[1] * 0.9 + 0.3], headLen * rnd(0.14, 0.3) * Math.min(1.2, maneLen + 0.3), j(0.5), 0.8);
    }
    const dock = T([-1.1 * L, 0.2 * D]);
    const tailLen = L * rnd(0.55, 0.95) * (buildName === 'foal' ? 0.55 : 1);
    const tdir = run || poseName === 'gallop' || poseName === 'trot' ? [-1, rnd(-0.25, 0.25)] : poseName === 'rear' ? [-0.5, 1] : [-0.22 - R() * 0.2, 1];
    for (let i = 0; i < 46; i++) tailPts.push(...hair(add(dock, [j(3), j(5)]), [tdir[0] + j(0.12), tdir[1] + j(0.12)], tailLen * rnd(0.7, 1.1), (tdir[1] < 0.5 ? 1.1 : -0.25) + j(0.45), 0.8));

    // ---------- ground ----------
    reseed('ground');
    const gy = run ? groundY + 3 : Math.max(...Object.values(legs).map((l) => bbox(l.hoof)[3]));
    const gx0 = -L * 2.3, gW = L * 3.6, gx = (x) => gx0 + ((((x - gx0) - phase * gW) % gW) + gW) % gW;   // ground scrolls back while running
    for (let i = 0; i < 9; i++) {
      let x = rnd(bx0 - 60, bx1 + 20), w = rnd(30, 150); const y = gy + 2 + rnd(0, 9) * (i ? 1 : 0);
      if (run) { x = gx(gx0 + R() * gW); w = Math.min(w * 0.5, gx0 + gW - x); }
      push(resample([[x, y], [x + w, y + j(1.5)]], 3), 0.7);
    }
    for (let i = 0; i < 26; i++) { let x = rnd(bx0 - 70, bx1 + 50); if (run) x = gx(gx0 + R() * gW); const y = gy + rnd(1, 8), hgt = rnd(4, 13); push([[x, y], [x + j(3), y - hgt * 0.5], [x + j(6), y - hgt]], 0.6); }

    // ---------- hand wobble + fit to frame ----------
    const all = [];
    reseed('wobble'); const ph = R() * 100;
    for (const ln of lines) {
      const p = ln.pl.map((q) => [q[0] + (noise(q[0] * 0.035 + ph, q[1] * 0.035) - 0.5) * 3.2 * wobble, q[1] + (noise(q[0] * 0.035, q[1] * 0.035 + ph) - 0.5) * 3.2 * wobble]);
      all.push({ pl: p, w: ln.w });
    }
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    for (const ln of all) for (const p of ln.pl) { X0 = Math.min(X0, p[0]); Y0 = Math.min(Y0, p[1]); X1 = Math.max(X1, p[0]); Y1 = Math.max(Y1, p[1]); }
    const Wd = 800, Ht = 600, pad = 50;
    let s = Math.min((Wd - pad * 2) / (X1 - X0), (Ht - pad * 2) / (Y1 - Y0), 1.6);
    let ox = (Wd - (X1 - X0) * s) / 2 - X0 * s, oy = (Ht - (Y1 - Y0) * s) / 2 - Y0 * s;
    if (run) { s = Math.min(1.15, 300 / L); ox = Wd / 2 + 0.42 * L * s; oy = Ht * 0.83 - groundY * s; }   // fixed frame so the animation does not jump
    reseed('flip');
    const flip = opt.flip == null ? R() < 0.5 : !!opt.flip;
    for (const ln of all) ln.pl = ln.pl.map((p) => { const x = p[0] * s + ox; return [Math.round((flip ? Wd - x : x) * 10) / 10, Math.round((p[1] * s + oy) * 10) / 10]; });
    // paintable regions (same frame as the lines) for colouring
    const fin = (p) => { const x = p[0] * s + ox; return [flip ? Wd - x : x, p[1] * s + oy]; };
    const thin = (poly, k) => poly.filter((_, i) => i % k === 0).map(fin);
    function hull(pts) {
      const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const q of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (const q of P.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    const legReg = (lg) => { const k0 = Math.floor(lg.lm.left.length * lg.skip * 0.5); return { far: lg.far, poly: lg.lm.left.slice(k0).concat(lg.lm.right.slice(k0).reverse()).filter((_, i) => i % 3 === 0).map(fin) }; };
    const regions = {
      body: thin(bodyPoly, 4),
      legs: [legs.fF, legs.hF, legs.fN, legs.hN].map(legReg),
      hooves: Object.values(legs).map((l) => l.hoof.map(fin)),
      mane: maneRoots.length > 2 ? maneRoots.concat(maneTips.slice().reverse()).map(fin) : null,
      tail: hull(tailPts).map(fin),
      blobs: [bp(-0.82, 0.35), bp(0.0, 0.5), bp(-0.42, 0.72), T(add(poll, mul(u, 0))) ].map((c) => fin(c).concat([0.3 * D * s])),
      scale: s,
    };
    return { polylines: all, regions, w: Wd, h: Ht, info: { build: buildName, pose: poseName, coat: coatName } };
  }

  horsedraw.toSVG = function (res, o) {
    o = o || {};
    const ink = o.ink || '#1d1a17', bg = o.paper == null ? '#f6f1df' : o.paper, sw = o.stroke || 1.3;
    let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${res.w} ${res.h}" width="${res.w}" height="${res.h}">`;
    if (bg) out += `<rect width="100%" height="100%" fill="${bg}"/>`;
    if (o.under) out += `<image href="${o.under}" x="0" y="0" width="${res.w}" height="${res.h}" style="mix-blend-mode:multiply"/>`;
    out += `<g fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round">`;
    res.polylines.forEach((ln, i) => {
      const anim = o.animate ? ` pathLength="1" class="hd" style="animation-delay:${(i * (o.animate / res.polylines.length)).toFixed(3)}s"` : '';
      out += `<path d="M${ln.pl.map((p) => p.join(' ')).join('L')}" stroke-width="${(sw * ln.w).toFixed(2)}"${anim}/>`;
    });
    return out + '</g></svg>';
  };

  root.horsedraw = horsedraw;
  if (typeof module !== 'undefined') module.exports = horsedraw;
})(typeof window !== 'undefined' ? window : globalThis);
