// Faster drop-in versions of Nonflowers' per-pixel Layer helpers (same math, no per-pixel array slicing).
// Load after nonflowers/main.js. The original file is left untouched.
(function () {
  Layer.filter = function (ctx, f) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const imgd = ctx.getImageData(0, 0, w, h), pix = imgd.data;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
      if (pix[i + 3] === 0) continue;            // transparent pixels stay transparent either way
      const o = f(x, y, pix[i], pix[i + 1], pix[i + 2], pix[i + 3]);
      pix[i] = o[0]; pix[i + 1] = o[1]; pix[i + 2] = o[2]; pix[i + 3] = o[3];
    }
    ctx.putImageData(imgd, 0, 0);
  };
  Layer.bound = function (ctx) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const pix = ctx.getImageData(0, 0, w, h).data;
    let xmin = w, xmax = 0, ymin = h, ymax = 0;
    for (let y = 0, i = 3; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
      if (pix[i] > 0) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
    }
    return { xmin, xmax, ymin, ymax };
  };
})();
