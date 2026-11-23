/**
 * js/environment.js
 * Ambient bioluminescent forest backdrop data: parallax bokeh orbs,
 * floating golden/cyan pollen particles, and swaying border ferns.
 */
window.Lumen = window.Lumen || {};

Lumen.WorldEnv = {
  bokehOrbs: Array.from({ length: 42 }, () => ({
    x: Lumen.Utils.rand(0, Lumen.CONFIG.WORLD_W),
    y: Lumen.Utils.rand(0, Lumen.CONFIG.WORLD_H),
    r: Lumen.Utils.rand(26, 95),
    depth: Lumen.Utils.rand(0.25, 0.72),
    col: Math.random() < 0.55 ? '#69f0ae' : Math.random() < 0.7 ? '#7ef9ff' : '#ffd24a',
    alpha: Lumen.Utils.rand(0.035, 0.11),
    phase: Lumen.Utils.rand(0, Lumen.Utils.TAU),
    speed: Lumen.Utils.rand(0.3, 0.9)
  })),

  ambientPollen: Array.from({ length: 95 }, () => ({
    x: Lumen.Utils.rand(0, Lumen.CONFIG.WORLD_W),
    y: Lumen.Utils.rand(0, Lumen.CONFIG.WORLD_H),
    vx: Lumen.Utils.rand(-14, 14),
    vy: Lumen.Utils.rand(-18, -4),
    r: Lumen.Utils.rand(1.1, 2.7),
    phase: Lumen.Utils.rand(0, Lumen.Utils.TAU),
    col: Math.random() < 0.65 ? '#fff5bd' : '#7ef9ff'
  })),

  forestFerns: Array.from({ length: 28 }, (_, i) => {
    const { WORLD_W, WORLD_H } = Lumen.CONFIG;
    const { rand, TAU } = Lumen.Utils;
    const edge = i % 4;
    let x = 0;
    let y = 0;
    let angle = 0;
    if (edge === 0) {
      x = rand(80, WORLD_W - 80);
      y = 18;
      angle = Math.PI / 2 + rand(-0.35, 0.35);
    } else if (edge === 1) {
      x = rand(80, WORLD_W - 80);
      y = WORLD_H - 18;
      angle = -Math.PI / 2 + rand(-0.35, 0.35);
    } else if (edge === 2) {
      x = 18;
      y = rand(80, WORLD_H - 80);
      angle = rand(-0.35, 0.35);
    } else {
      x = WORLD_W - 18;
      y = rand(80, WORLD_H - 80);
      angle = Math.PI + rand(-0.35, 0.35);
    }
    return { x, y, angle, len: rand(110, 210), swayPhase: rand(0, TAU) };
  }),

  update(dt) {
    const { WORLD_W, WORLD_H } = Lumen.CONFIG;
    for (const p of this.ambientPollen) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x += WORLD_W;
      if (p.x > WORLD_W) p.x -= WORLD_W;
      if (p.y < 0) p.y += WORLD_H;
      if (p.y > WORLD_H) p.y -= WORLD_H;
    }
  }
};