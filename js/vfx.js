/**
 * js/vfx.js
 * Manages particle bursts, expanding shockwave rings, floating world callouts,
 * camera shake, hitstop freeze frames, and full-screen impact flashes.
 */
window.Lumen = window.Lumen || {};

Lumen.VFX = {
  burst(x, y, col, count = 12, speed = 150, size = 3.5, life = 0.5) {
    const { rand, TAU } = Lumen.Utils;
    for (let i = 0; i < count; i++) {
      const ang = rand(0, TAU);
      const spd = rand(speed * 0.25, speed);
      Lumen.State.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: rand(size * 0.45, size),
        col,
        life: rand(life * 0.55, life),
        maxLife: life,
        drag: rand(0.91, 0.96)
      });
    }
  },

  ring(x, y, r0, r1, life, col, width = 3) {
    Lumen.State.rings.push({ x, y, r0, r1, life, maxLife: life, col, width });
  },

  callout(x, y, text, col = '#fff5bd') {
    Lumen.State.callouts.push({ x, y, vy: -36, text, col, life: 1.35, maxLife: 1.35 });
  },

  shake(mag) {
    Lumen.State.shakeMag = Math.max(Lumen.State.shakeMag, mag);
  },

  hitstop(duration) {
    Lumen.State.hitstopT = Math.max(Lumen.State.hitstopT, duration);
  },

  flash(intensity, col) {
    Lumen.State.flash = intensity;
    Lumen.State.flashCol = col;
  },

  update(dt) {
    const State = Lumen.State;
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.life -= dt;
      if (p.life <= 0) State.particles.splice(i, 1);
    }

    for (let i = State.rings.length - 1; i >= 0; i--) {
      State.rings[i].life -= dt;
      if (State.rings[i].life <= 0) State.rings.splice(i, 1);
    }

    for (let i = State.callouts.length - 1; i >= 0; i--) {
      const c = State.callouts[i];
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0) State.callouts.splice(i, 1);
    }
  }
};