/**
 * js/renderer.js
 * Renders the bioluminescent clearing, magnetic motes, boss treasure chests,
 * projectiles, player firefly, enemies, all 16 Moth Bosses, VFX, and minimap.
 */
window.Lumen = window.Lumen || {};

Lumen.Renderer = {
  renderBackground(ctx) {
    const { CONFIG, State, WorldEnv } = Lumen;
    const W = CONFIG.WORLD_W;
    const H = CONFIG.WORLD_H;

    const bgGrad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      120,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.72
    );
    bgGrad.addColorStop(0, '#0a222d');
    bgGrad.addColorStop(0.55, '#06151e');
    bgGrad.addColorStop(1, '#030b10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(126, 249, 255, 0.045)';
    ctx.lineWidth = 1;
    const step = 160;
    const startX = Math.max(0, Math.floor((State.cam.x - State.cam.w * 0.6) / step) * step);
    const endX = Math.min(W, Math.ceil((State.cam.x + State.cam.w * 0.6) / step) * step);
    const startY = Math.max(0, Math.floor((State.cam.y - State.cam.h * 0.6) / step) * step);
    const endY = Math.min(H, Math.ceil((State.cam.y + State.cam.h * 0.6) / step) * step);

    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    if (WorldEnv) {
      if (typeof WorldEnv.render === 'function') WorldEnv.render(ctx);
      else if (typeof WorldEnv.draw === 'function') WorldEnv.draw(ctx);
    }

    ctx.strokeStyle = 'rgba(126, 249, 255, 0.28)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.restore();
  },

  renderMotes(ctx) {
    const { State, Utils } = Lumen;
    for (const m of State.moteOrbs) {
      if (!m) continue;
      const pulse = 0.85 + 0.15 * Math.sin(m.phase);
      ctx.save();
      ctx.translate(m.x, m.y);

      if (m.kind === 'powerup') {
        const isNova = m.powerType === 'nova';
        const mainCol = isNova ? '#ffd24a' : '#7ef9ff';
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28 * pulse);
        glow.addColorStop(0, Utils.hexWithAlpha(mainCol, 0.85));
        glow.addColorStop(1, Utils.hexWithAlpha(mainCol, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 28 * pulse, 0, Utils.TAU);
        ctx.fill();

        ctx.strokeStyle = mainCol;
        ctx.lineWidth = 2;
        ctx.rotate(m.phase * 0.35);
        ctx.strokeRect(-9, -9, 18, 18);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Utils.TAU);
        ctx.fill();
      } else {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 15 * pulse);
        glow.addColorStop(0, 'rgba(255, 210, 74, 0.85)');
        glow.addColorStop(1, 'rgba(255, 210, 74, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 15 * pulse, 0, Utils.TAU);
        ctx.fill();

        ctx.fillStyle = '#fff5bd';
        ctx.beginPath();
        ctx.arc(0, 0, 3.6 * pulse, 0, Utils.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  renderTreasureDrops(ctx) {
    const { State, Utils } = Lumen;
    if (!State.treasureDrops) return;

    for (const drop of State.treasureDrops) {
      const pulse = 0.85 + 0.15 * Math.sin(drop.phase);
      const bobY = Math.sin(drop.phase * 0.8) * 4;

      ctx.save();
      ctx.translate(drop.x, drop.y + bobY);

      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 44 * pulse);
      halo.addColorStop(0, 'rgba(255, 210, 74, 0.9)');
      halo.addColorStop(0.5, 'rgba(126, 249, 255, 0.35)');
      halo.addColorStop(1, 'rgba(126, 249, 255, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 44 * pulse, 0, Utils.TAU);
      ctx.fill();

      ctx.fillStyle = '#0c2430';
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 5);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.lineTo(14, -2);
      ctx.stroke();

      ctx.fillStyle = '#7ef9ff';
      ctx.fillRect(-3.5, -5, 7, 7);

      ctx.restore();
    }
  },

  renderProjectiles(ctx) {
    const { State, Utils } = Lumen;

    for (const b of State.pshots) {
      if (!b) continue;
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);

      const grad = ctx.createLinearGradient(-16, 0, 8, 0);
      grad.addColorStop(0, Utils.hexWithAlpha(b.col || '#ffd24a', 0));
      grad.addColorStop(0.6, Utils.hexWithAlpha(b.col || '#ffd24a', 0.85));
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, b.r || 4.2, 0, 0, Utils.TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const s of State.eshots) {
      if (!s) continue;
      ctx.save();
      const col = s.col || '#ff4fa3';
      const glow = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 2.3);
      glow.addColorStop(0, Utils.hexWithAlpha(col, 0.85));
      glow.addColorStop(1, Utils.hexWithAlpha(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.3, 0, Utils.TAU);
      ctx.fill();

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Utils.TAU);
      ctx.fill();

      ctx.fillStyle = '#fff5bd';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.42, 0, Utils.TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const sk of State.seekers) {
      if (!sk) continue;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 79, 163, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(sk.x, sk.y, sk.r * 1.15, sk.phase * 0.4, sk.phase * 0.4 + Math.PI * 1.3);
      ctx.stroke();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(sk.x, sk.y, sk.r * 0.85, 0, Utils.TAU);
      ctx.fill();

      ctx.fillStyle = '#fff5bd';
      ctx.beginPath();
      ctx.arc(sk.x, sk.y, sk.r * 0.55, 0, Utils.TAU);
      ctx.fill();
      ctx.restore();
    }
  },

  renderPlayer(ctx) {
    const { State, Utils } = Lumen;
    const p = State.player;
    if (!p) return;

    for (let i = 0; i < p.trail.length; i++) {
      const tr = p.trail[i];
      const ratio = tr.life / 0.24;
      ctx.fillStyle = `rgba(255, 210, 74, ${ratio * 0.25})`;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 9 * ratio, 0, Utils.TAU);
      ctx.fill();
    }

    if (p.invulnT > 0 && Math.floor(p.invulnT * 18) % 2 === 1 && p.dashActiveT <= 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 72);
    halo.addColorStop(0, 'rgba(255, 245, 189, 0.55)');
    halo.addColorStop(0.45, 'rgba(255, 210, 74, 0.16)');
    halo.addColorStop(1, 'rgba(255, 210, 74, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Utils.TAU);
    ctx.fill();

    if (p.shield) {
      const sPulse = 0.82 + 0.18 * Math.sin(State.time * 8);
      ctx.strokeStyle = `rgba(126, 249, 255, ${0.72 * sPulse})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Utils.TAU);
      ctx.stroke();
    }

    ctx.rotate(p.angle + Math.PI / 2);

    const flap = Math.sin(p.wingPhase) * 0.42;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(flap);
      ctx.fillStyle = 'rgba(126, 249, 255, 0.34)';
      ctx.strokeStyle = 'rgba(255, 245, 189, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(12, 2, 11, 5.5, 0.35, 0, Utils.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#1b3b48';
    ctx.beginPath();
    ctx.ellipse(0, -2, 5.2, 10, 0, 0, Utils.TAU);
    ctx.fill();

    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.ellipse(0, 5, 5.5, 7, 0, 0, Utils.TAU);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Utils.TAU);
    ctx.fill();

    ctx.restore();
  },

  renderFoe(ctx, f) {
    const { Utils } = Lumen;
    ctx.save();
    ctx.translate(f.x, f.y);

    const isFlashing = f.hitFlash > 0;
    const mainCol = isFlashing ? '#ffffff' : f.col;
    const accentCol = isFlashing ? '#ffffff' : f.accent || f.col;
    const flap = Math.sin(f.phase) * 0.35;

    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, f.r * 1.9);
    aura.addColorStop(0, Utils.hexWithAlpha(f.col, 0.32));
    aura.addColorStop(1, Utils.hexWithAlpha(f.col, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 1.9, 0, Utils.TAU);
    ctx.fill();

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(flap);
      ctx.fillStyle = Utils.hexWithAlpha(mainCol, 0.45);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(f.r * 0.68, 0, f.r * 0.65, f.r * 0.36, 0.25, 0, Utils.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = accentCol;
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 0.55, 0, Utils.TAU);
    ctx.fill();

    ctx.fillStyle = '#fff5bd';
    ctx.beginPath();
    ctx.arc(-4, -3, 2, 0, Utils.TAU);
    ctx.arc(4, -3, 2, 0, Utils.TAU);
    ctx.fill();

    if (f.hp < f.maxHp) {
      const barW = f.r * 1.6;
      const pct = Utils.clamp(f.hp / f.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(5, 16, 23, 0.75)';
      ctx.fillRect(-barW / 2, -f.r - 12, barW, 4);
      ctx.fillStyle = f.col;
      ctx.fillRect(-barW / 2, -f.r - 12, barW * pct, 4);
    }

    ctx.restore();
  },

  renderBoss(ctx, b) {
    const { State, Utils } = Lumen;

    if (b.dashState === 'telegraph') {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(State.time * 28);
      const laneGrad = ctx.createLinearGradient(b.dashStartX, b.dashStartY, b.dashEndX, b.dashEndY);
      laneGrad.addColorStop(0, Utils.hexWithAlpha(b.primaryCol || '#ff4fa3', 0.25 + 0.2 * pulse));
      laneGrad.addColorStop(0.6, `rgba(255, 23, 68, ${0.34 + 0.25 * pulse})`);
      laneGrad.addColorStop(1, 'rgba(255, 210, 74, 0.05)');

      ctx.strokeStyle = laneGrad;
      ctx.lineWidth = 48;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.dashStartX, b.dashStartY);
      ctx.lineTo(b.dashEndX, b.dashEndY);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 245, 189, ${0.55 + 0.35 * pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(b.dashStartX, b.dashStartY);
      ctx.lineTo(b.dashEndX, b.dashEndY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(b.x, b.y);

    const style = b.mothStyle || 'luna';
    const isGuarding = b.guardTimer > 0;
    const isFlashing = b.hitFlash > 0;
    const flap = Math.sin(b.wingPhase) * 0.16;
    const wingScaleX = 1 - Math.abs(Math.sin(b.wingPhase)) * 0.14;

    const auraCol = b.phase === 3 ? '#ff1744' : (b.primaryCol || '#98f5b8');
    const aura = ctx.createRadialGradient(0, 0, 14, 0, 0, 138);
    aura.addColorStop(0, Utils.hexWithAlpha(auraCol, 0.38));
    aura.addColorStop(0.6, Utils.hexWithAlpha(auraCol, 0.12));
    aura.addColorStop(1, Utils.hexWithAlpha(auraCol, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 138, 0, Utils.TAU);
    ctx.fill();

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * wingScaleX, 1);
      ctx.rotate(flap);
      this._drawMothSideWings(ctx, style, b, isFlashing);
      ctx.restore();
    }

    this._drawMothBody(ctx, style, b, isFlashing);

    if (isGuarding) {
      const guardPulse = 0.75 + 0.25 * Math.sin(State.time * 16);
      ctx.strokeStyle = `rgba(126, 249, 255, ${0.78 * guardPulse})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      const sides = 6;
      const shieldR = 72;
      for (let s = 0; s <= sides; s++) {
        const a = (s / sides) * Utils.TAU + State.time * 0.9;
        const px = Math.cos(a) * shieldR;
        const py = Math.sin(a) * shieldR;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.restore();
  },

  _drawMothSideWings(ctx, style, b, flash) {
    const { Utils } = Lumen;
    const pCol = flash ? '#ffffff' : b.primaryCol;
    const sCol = flash ? '#ffffff' : b.secondaryCol;
    const aCol = flash ? '#ffffff' : b.accentCol;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    switch (style) {
      case 'luna': {
        ctx.fillStyle = pCol;
        ctx.strokeStyle = sCol;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.bezierCurveTo(38, -36, 78, -34, 84, -14);
        ctx.bezierCurveTo(86, 2, 54, 14, 10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.bezierCurveTo(46, 4, 62, 22, 46, 36);
        ctx.bezierCurveTo(38, 46, 42, 68, 46, 82);
        ctx.bezierCurveTo(40, 86, 33, 80, 32, 68);
        ctx.bezierCurveTo(30, 52, 22, 40, 6, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#7f5539';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.quadraticCurveTo(46, -34, 82, -16);
        ctx.stroke();

        ctx.fillStyle = aCol;
        ctx.strokeStyle = '#7f5539';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(42, -12, 5, 0, Utils.TAU);
        ctx.arc(32, 20, 4, 0, Utils.TAU);
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'comet': {
        ctx.fillStyle = pCol;
        ctx.strokeStyle = sCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.bezierCurveTo(42, -38, 84, -32, 88, -12);
        ctx.bezierCurveTo(86, 4, 52, 14, 10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.bezierCurveTo(48, 6, 62, 24, 44, 38);
        ctx.bezierCurveTo(36, 52, 42, 74, 48, 92);
        ctx.bezierCurveTo(41, 95, 34, 88, 33, 74);
        ctx.bezierCurveTo(31, 56, 22, 42, 6, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = aCol;
        ctx.beginPath();
        ctx.arc(44, -12, 5.5, 0, Utils.TAU);
        ctx.arc(32, 20, 4.5, 0, Utils.TAU);
        ctx.fill();
        break;
      }

      case 'atlas': {
        ctx.fillStyle = pCol;
        ctx.strokeStyle = sCol;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.bezierCurveTo(44, -36, 82, -38, 90, -20);
        ctx.bezierCurveTo(92, -6, 74, 10, 10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 6);
        ctx.bezierCurveTo(52, 6, 68, 26, 52, 46);
        ctx.bezierCurveTo(34, 56, 16, 44, 6, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = aCol;
        ctx.beginPath();
        ctx.moveTo(36, -12);
        ctx.lineTo(54, -18);
        ctx.lineTo(48, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(28, 22);
        ctx.lineTo(42, 20);
        ctx.lineTo(35, 34);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'rosy_maple': {
        ctx.fillStyle = pCol;
        ctx.beginPath();
        ctx.moveTo(6, -14);
        ctx.lineTo(74, 16);
        ctx.lineTo(10, 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = sCol;
        ctx.beginPath();
        ctx.moveTo(18, -4);
        ctx.lineTo(58, 12);
        ctx.lineTo(42, 20);
        ctx.lineTo(12, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = pCol;
        ctx.beginPath();
        ctx.ellipse(26, 26, 22, 13, 0.35, 0, Utils.TAU);
        ctx.fill();
        break;
      }

      case 'deaths_head': {
        ctx.fillStyle = pCol;
        ctx.beginPath();
        ctx.ellipse(34, 16, 28, 15, 0.25, 0, Utils.TAU);
        ctx.fill();

        ctx.fillStyle = sCol;
        ctx.strokeStyle = '#6f4e37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, -14);
        ctx.bezierCurveTo(44, -26, 82, -20, 86, -4);
        ctx.bezierCurveTo(84, 8, 46, 12, 8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'tiger':
      case 'jersey_tiger':
      case 'cinnabar':
      case 'peppered':
      case 'elephant_hawk': {
        const baseFill =
          style === 'tiger' ? pCol :
          style === 'elephant_hawk' ? sCol :
          style === 'peppered' ? pCol : sCol;

        if (style === 'jersey_tiger' || style === 'cinnabar') {
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.ellipse(26, 24, 24, 14, 0.3, 0, Utils.TAU);
          ctx.fill();
        }

        ctx.fillStyle = baseFill;
        ctx.strokeStyle = style === 'cinnabar' ? pCol : (style === 'peppered' ? sCol : 'rgba(255,255,255,0.2)');
        ctx.lineWidth = style === 'cinnabar' ? 3.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(4, -18);
        ctx.lineTo(74, 24);
        ctx.quadraticCurveTo(44, 34, 6, 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (style === 'tiger') {
          ctx.strokeStyle = sCol;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(22, -4); ctx.lineTo(16, 16);
          ctx.moveTo(38, 4); ctx.lineTo(30, 24);
          ctx.moveTo(54, 13); ctx.lineTo(48, 26);
          ctx.stroke();
        } else if (style === 'jersey_tiger') {
          ctx.strokeStyle = aCol;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(20, -6); ctx.lineTo(30, 22);
          ctx.moveTo(36, 2); ctx.lineTo(48, 24);
          ctx.moveTo(52, 12); ctx.lineTo(62, 24);
          ctx.stroke();
        } else if (style === 'cinnabar') {
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.arc(46, 14, 4.5, 0, Utils.TAU);
          ctx.arc(60, 21, 4, 0, Utils.TAU);
          ctx.fill();
        } else if (style === 'peppered') {
          ctx.fillStyle = aCol;
          const dots = [[22, 4], [32, 12], [20, 18], [44, 16], [54, 22], [36, 22]];
          for (const [dx, dy] of dots) {
            ctx.beginPath();
            ctx.arc(dx, dy, 2.2, 0, Utils.TAU);
            ctx.fill();
          }
        } else if (style === 'elephant_hawk') {
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.moveTo(6, -18);
          ctx.lineTo(74, 24);
          ctx.lineTo(56, 28);
          ctx.lineTo(6, -4);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'cecropia':
      case 'polyphemus': {
        ctx.fillStyle = sCol;
        ctx.strokeStyle = pCol;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(44, -8, 42, 22, -0.18, 0, Utils.TAU);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(34, 18, 30, 18, 0.32, 0, Utils.TAU);
        ctx.fill();
        ctx.stroke();

        if (style === 'polyphemus') {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.arc(34, 18, 10, 0, Utils.TAU);
          ctx.fill();

          ctx.fillStyle = '#14141c';
          ctx.beginPath();
          ctx.arc(34, 18, 7, 0, Utils.TAU);
          ctx.fill();

          ctx.fillStyle = aCol;
          ctx.beginPath();
          ctx.arc(34, 18, 3.8, 0, Utils.TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = aCol;
          ctx.beginPath();
          ctx.ellipse(42, -10, 8, 4, -0.3, 0, Utils.TAU);
          ctx.ellipse(32, 18, 7, 3.5, 0.2, 0, Utils.TAU);
          ctx.fill();
        }
        break;
      }

      case 'sunset': {
        ctx.fillStyle = '#14141c';
        ctx.strokeStyle = pCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.lineTo(82, -22);
        ctx.lineTo(68, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(8, 6);
        ctx.lineTo(62, 14);
        ctx.lineTo(54, 42);
        ctx.lineTo(44, 36);
        ctx.lineTo(36, 46);
        ctx.lineTo(26, 36);
        ctx.lineTo(8, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const stripes = [pCol, aCol, sCol];
        stripes.forEach((col, idx) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(22 + idx * 16, -16);
          ctx.lineTo(18 + idx * 14, 6);
          ctx.stroke();
        });
        break;
      }

      case 'silk':
      case 'brimstone':
      case 'hawk':
      default: {
        ctx.fillStyle = pCol;
        ctx.strokeStyle = sCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(42, -8, 38, 22, style === 'brimstone' || style === 'hawk' ? -0.25 : -0.1, 0, Utils.TAU);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(32, 16, 28, 18, 0.25, 0, Utils.TAU);
        ctx.fill();
        ctx.stroke();

        if (style === 'brimstone' || style === 'hawk') {
          ctx.fillStyle = aCol;
          ctx.beginPath();
          ctx.arc(38, -8, 3.5, 0, Utils.TAU);
          ctx.arc(28, 16, 3.2, 0, Utils.TAU);
          ctx.fill();
        }
        break;
      }
    }
  },

  _drawMothBody(ctx, style, b, flash) {
    const { Utils } = Lumen;
    const isLightBody = ['luna', 'rosy_maple', 'silk', 'peppered', 'comet', 'brimstone'].includes(style);
    const bodyCol = flash ? '#ffffff' : (isLightBody ? '#f8f4e8' : '#231924');

    const feathery = ['luna', 'rosy_maple', 'silk', 'atlas', 'cecropia', 'polyphemus', 'comet'].includes(style);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.strokeStyle = flash ? '#ffffff' : b.primaryCol;
      ctx.lineWidth = feathery ? 2.4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(3, -24);
      ctx.quadraticCurveTo(10, -38, 20, -40);
      ctx.stroke();

      if (feathery) {
        ctx.lineWidth = 1.2;
        for (let t = 0.25; t <= 0.95; t += 0.2) {
          const ax = 3 + t * 16;
          const ay = -24 - t * 15;
          ctx.beginPath();
          ctx.moveTo(ax - 3, ay - 2);
          ctx.lineTo(ax + 3, ay + 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.fillStyle = bodyCol;
    ctx.strokeStyle = flash ? '#ffffff' : b.primaryCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 4, 11, 26, 0, 0, Utils.TAU);
    ctx.fill();
    ctx.stroke();

    if (style === 'deaths_head' && !flash) {
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.arc(0, -6, 6.5, 0, Utils.TAU);
      ctx.fill();
      ctx.fillStyle = '#1b1b22';
      ctx.beginPath();
      ctx.arc(-2.2, -7, 1.5, 0, Utils.TAU);
      ctx.arc(2.2, -7, 1.5, 0, Utils.TAU);
      ctx.fill();

      ctx.fillStyle = '#ffc93c';
      ctx.fillRect(-7, 8, 14, 3);
      ctx.fillRect(-6, 15, 12, 3);
      ctx.fillRect(-4, 22, 8, 3);
    }

    ctx.fillStyle = b.phase === 3 ? '#ff1744' : '#7ef9ff';
    ctx.beginPath();
    ctx.arc(-4.2, -20, 2.6, 0, Utils.TAU);
    ctx.arc(4.2, -20, 2.6, 0, Utils.TAU);
    ctx.fill();
  },

  renderVFX(ctx) {
    const { State, Utils } = Lumen;

    for (const r of State.rings) {
      if (!r) continue;
      const maxL = r.maxLife || 0.4;
      const t = Utils.clamp(1 - r.life / maxL, 0, 1);
      const rad = Utils.lerp(r.r0 || r.r || 8, r.r1 || r.maxR || 80, t);
      ctx.save();
      ctx.strokeStyle = Utils.hexWithAlpha(r.col || '#ffd24a', (1 - t) * 0.85);
      ctx.lineWidth = (r.width || 3) * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, Utils.TAU);
      ctx.stroke();
      ctx.restore();
    }

    for (const pt of State.particles) {
      if (!pt) continue;
      const alpha = Utils.clamp(pt.life / (pt.maxLife || 0.4), 0, 1);
      ctx.fillStyle = Utils.hexWithAlpha(pt.col || '#ffd24a', alpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (pt.r || 3) * alpha, 0, Utils.TAU);
      ctx.fill();
    }

    for (const c of State.callouts) {
      if (!c) continue;
      const alpha = Utils.clamp(c.life / (c.maxLife || 1.2), 0, 1);
      ctx.save();
      ctx.font = '700 14px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = Utils.hexWithAlpha(c.col || '#ffd24a', alpha);
      ctx.fillText(c.text, c.x, c.y);
      ctx.restore();
    }
  },

  renderMinimap() {
    const { CONFIG, State, DOM } = Lumen;
    const mCtx = DOM.miniCtx;
    const mCanvas = DOM.miniCanvas;
    if (!mCtx || !mCanvas) return;

    const mw = mCanvas.width;
    const mh = mCanvas.height;
    mCtx.clearRect(0, 0, mw, mh);

    mCtx.fillStyle = 'rgba(5, 16, 23, 0.82)';
    mCtx.fillRect(0, 0, mw, mh);

    const sx = mw / CONFIG.WORLD_W;
    const sy = mh / CONFIG.WORLD_H;

    for (const m of State.moteOrbs) {
      if (!m) continue;
      mCtx.fillStyle = m.kind === 'powerup' ? '#7ef9ff' : 'rgba(255, 210, 74, 0.7)';
      mCtx.fillRect(m.x * sx - 1, m.y * sy - 1, 2.2, 2.2);
    }

    if (State.treasureDrops) {
      for (const drop of State.treasureDrops) {
        mCtx.fillStyle = '#ffd24a';
        mCtx.fillRect(drop.x * sx - 2.5, drop.y * sy - 2.5, 5, 5);
      }
    }

    for (const f of State.foes) {
      if (!f || f.dead) continue;
      if (f.type === 'boss') {
        mCtx.fillStyle = '#ff1744';
        mCtx.beginPath();
        mCtx.arc(f.x * sx, f.y * sy, 4.5, 0, Math.PI * 2);
        mCtx.fill();
      } else {
        mCtx.fillStyle = '#ff4fa3';
        mCtx.beginPath();
        mCtx.arc(f.x * sx, f.y * sy, 2.4, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    if (State.player) {
      mCtx.fillStyle = '#ffd24a';
      mCtx.beginPath();
      mCtx.arc(State.player.x * sx, State.player.y * sy, 3.2, 0, Math.PI * 2);
      mCtx.fill();
    }
  },

  render() {
    const { State, DOM } = Lumen;
    const ctx = DOM.ctx;
    if (!ctx) return;

    const cw = State.cam.w;
    const ch = State.cam.h;
    ctx.clearRect(0, 0, cw, ch);

    const shakeX = State.shakeMag > 0 ? (Math.random() - 0.5) * State.shakeMag : 0;
    const shakeY = State.shakeMag > 0 ? (Math.random() - 0.5) * State.shakeMag : 0;

    ctx.save();
    ctx.translate(cw / 2 - State.cam.x + shakeX, ch / 2 - State.cam.y + shakeY);

    this.renderBackground(ctx);
    this.renderMotes(ctx);
    this.renderTreasureDrops(ctx);
    this.renderPlayer(ctx);

    for (const f of State.foes) {
      if (!f || f.dead) continue;
      if (f.type === 'boss') this.renderBoss(ctx, f);
      else this.renderFoe(ctx, f);
    }

    this.renderProjectiles(ctx);
    this.renderVFX(ctx);
    ctx.restore();

    if (State.flash > 0) {
      ctx.fillStyle = Lumen.Utils.hexWithAlpha(State.flashCol || '#fff5bd', State.flash * 0.45);
      ctx.fillRect(0, 0, cw, ch);
    }

    this.renderMinimap();
  }
};