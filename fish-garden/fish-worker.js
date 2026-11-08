// Generates fish polylines with fishdraw (MIT, Lingdong Huang) off the main thread.
// fishdraw's globals (PI, pow, noise, bean…) collide with nonflowers, so it lives here.
importScripts('../fishdraw/fishdraw.js');

self.onmessage = (e) => {
  const { id, gen } = e.data;
  jsr = ~~(Math.random() * 100000) + 1;
  const name = binomen();
  jsr = str_to_seed(name);
  const lines = cleanup(reframe(fish(generate_params()), 4, ''));
  // drop the (empty) name text lines and round coords for transfer
  const out = lines
    .filter((pl) => pl.length > 1)
    .map((pl) => pl.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
  self.postMessage({ id, gen, name, lines: out });
};
