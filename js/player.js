/**
 * js/player.js
 * Manages firefly flight physics, Luminous Dash, mouse/touch aiming,
 * weapon tier progression, power-up effects, and player damage handling.
 */
window.Lumen = window.Lumen || {};

Lumen.PlayerController = {
  reset() {
    const { CONFIG, State } = Lumen;
    const maxHp = (CONFIG.PLAYER && CONFIG.PLAYER.MAX_HP) || 5;
    const dashMaxCd = (CONFIG.PLAYER && CONFIG.PLAYER.DASH_CD) || 1.75;

    State.player = {
      x: CONFIG.WORLD_W / 2,
      y: CONFIG.WORLD_H / 2,
      vx: 0,
      vy: 0,
      r: 14,
      angle: -Math.PI / 2,
      wingPhase: 0,
      hp: maxHp,
      maxHp,
      weaponTier: 0,
      shield: false,
      dashCd: 0,
      dashMaxCd,
      dashActiveT: 0,
      dashDirX: 0,
      dashDirY: -1,
      invulnT: 0,
      fireCd: 0,
      trail: []
    };
  },

  triggerDash() {
    const { CONFIG, State, InputController, VFX, sfx } = Lumen;
    if (State.mode !== 'playing') return;
    const p = State.player;
    if (!p || p.dashCd > 0 || p.dashActiveT > 0) return;

    const move = InputController.getMoveVector();
    let dx = move.x;
    let dy = move.y;
    const len = Math.hypot(dx, dy);
    if (len > 0.05) {
      dx /= len;
      dy /= len;
    } else {
      dx = Math.cos(p.angle);
      dy = Math.sin(p.angle);
    }

    p.dashDirX = dx;
    p.dashDirY = dy;
    p.dashActiveT = (CONFIG.PLAYER && CONFIG.PLAYER.DASH_DURATION) || 0.22;
    p.dashCd = p.dashMaxCd;
    p.invulnT = Math.max(p.invulnT, p.dashActiveT + 0.12);

    VFX.ring(p.x, p.y, 8, 64, 0.32, '#7ef9ff', 3);
    VFX.burst(p.x, p.y, '#ffd24a', 14, 180, 4, 0.4);
    if (sfx && typeof sfx.dash === 'function') sfx.dash();
  },

  getAimAngle() {
    const { State, InputController } = Lumen;
    const p = State.player;
    const inp = InputController.state;

    if (inp.touchActive) {
      let nearest = null;
      let bestDistSq = 650 * 650;
      for (const f of State.foes) {
        if (!f || f.dead) continue;
        const dx = f.x - p.x;
        const dy = f.y - p.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          nearest = f;
        }
      }
      if (nearest) {
        return Math.atan2(nearest.y - p.y, nearest.x - p.x);
      }
      if (Math.hypot(inp.stickX, inp.stickY) > 0.1) {
        return Math.atan2(inp.stickY, inp.stickX);
      }
      return p.angle;
    }

    const worldMouseX = State.cam.x - State.cam.w / 2 + inp.mouseX;
    const worldMouseY = State.cam.y - State.cam.h / 2 + inp.mouseY;
    return Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
  },

  fireWeapon() {
    const { CONFIG, State, VFX, sfx } = Lumen;
    const p = State.player;
    const tiers = CONFIG.WEAPON_TIERS || [
      { name: 'SPARK', count: 1, spread: 0, rate: 0.17, dmg: 10, speed: 640 },
      { name: 'TWIN GLEAM', count: 2, spread: 0.09, rate: 0.155, dmg: 10, speed: 670 },
      { name: 'TRI-LUMEN', count: 3, spread: 0.13, rate: 0.145, dmg: 11, speed: 700 },
      { name: 'RADIANT FAN', count: 4, spread: 0.11, rate: 0.135, dmg: 12, speed: 730 },
      { name: 'SOLAR CROWN', count: 5, spread: 0.1, rate: 0.125, dmg: 13, speed: 760 }
    ];

    const tierIdx = Math.min(p.weaponTier, tiers.length - 1);
    const tier = tiers[tierIdx] || tiers[0];
    const count = tier.count || tierIdx + 1;
    const spread = tier.spread !== undefined ? tier.spread : 0.11;
    const speed = tier.speed || 680;
    const dmg = tier.dmg || 10 + tierIdx * 2;
    const rate = tier.rate || Math.max(0.11, 0.17 - tierIdx * 0.012);

    p.fireCd = rate;
    const baseAng = p.angle;
    const startOffset = -((count - 1) * spread) / 2;

    for (let i = 0; i < count; i++) {
      const ang = baseAng + startOffset + i * spread;
      const isCenter = Math.abs(i - (count - 1) / 2) < 0.6;
      State.pshots.push({
        x: p.x + Math.cos(ang) * 18,
        y: p.y + Math.sin(ang) * 18,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        dmg,
        r: isCenter ? 4.8 : 4.0,
        col: isCenter ? '#ffd24a' : '#7ef9ff',
        life: 1.35
      });
    }

    VFX.burst(
      p.x + Math.cos(baseAng) * 16,
      p.y + Math.sin(baseAng) * 16,
      '#fff5bd',
      2,
      70,
      2.2,
      0.16
    );
    if (sfx && typeof sfx.shoot === 'function') sfx.shoot();
  },

  checkWeaponProgression() {
    const { CONFIG, State, VFX, sfx } = Lumen;
    const p = State.player;
    const tiers = CONFIG.WEAPON_TIERS || [];
    const maxTier = Math.max(0, tiers.length - 1);
    if (p.weaponTier >= maxTier) return;

    const thresholds = [0, 12, 30, 60, 100, 150];
    const nextTier = p.weaponTier + 1;
    const tierObj = tiers[nextTier];
    const req = (tierObj && (tierObj.motes || tierObj.req)) || thresholds[nextTier] || nextTier * 25;

    if (State.motes >= req) {
      p.weaponTier = nextTier;
      const label = (tierObj && tierObj.name) || `TIER ${nextTier + 1}`;
      VFX.ring(p.x, p.y, 12, 110, 0.55, '#ffd24a', 3.5);
      VFX.burst(p.x, p.y, '#ffd24a', 20, 190, 4.5, 0.55);
      VFX.callout(p.x, p.y - 34, label, '#ffd24a');
      if (sfx && typeof sfx.powerup === 'function') sfx.powerup();
    }
  },

  update(dt, rawDt) {
    const { CONFIG, State, Utils, InputController } = Lumen;
    const p = State.player;
    if (!p) return;

    const moveSpeed = (CONFIG.PLAYER && CONFIG.PLAYER.SPEED) || 345;
    const dashSpeed = (CONFIG.PLAYER && CONFIG.PLAYER.DASH_SPEED) || 880;

    p.wingPhase += rawDt * (p.dashActiveT > 0 ? 36 : 22);
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.invulnT > 0) p.invulnT = Math.max(0, p.invulnT - dt);
    if (p.fireCd > 0) p.fireCd = Math.max(0, p.fireCd - dt);

    if (p.dashActiveT > 0) {
      p.dashActiveT = Math.max(0, p.dashActiveT - dt);
      p.vx = p.dashDirX * dashSpeed;
      p.vy = p.dashDirY * dashSpeed;
    } else {
      const move = InputController.getMoveVector();
      const targetVx = move.x * moveSpeed;
      const targetVy = move.y * moveSpeed;
      const accel = 1 - Math.exp(-14 * dt);
      p.vx = Utils.lerp(p.vx, targetVx, accel);
      p.vy = Utils.lerp(p.vy, targetVy, accel);
    }

    p.x = Utils.clamp(p.x + p.vx * dt, 42, CONFIG.WORLD_W - 42);
    p.y = Utils.clamp(p.y + p.vy * dt, 42, CONFIG.WORLD_H - 42);

    p.trail.push({ x: p.x, y: p.y, life: 0.24 });
    for (let i = p.trail.length - 1; i >= 0; i--) {
      p.trail[i].life -= dt;
      if (p.trail[i].life <= 0) p.trail.splice(i, 1);
    }

    p.angle = this.getAimAngle();

    const wantsFire =
      InputController.state.mouseDown ||
      State.autoFire ||
      InputController.state.touchActive;
    if (wantsFire && p.fireCd <= 0) {
      this.fireWeapon();
    }

    this.checkWeaponProgression();

    const camLerp = 1 - Math.exp(-9 * rawDt);
    State.cam.x = Utils.lerp(State.cam.x, p.x, camLerp);
    State.cam.y = Utils.lerp(State.cam.y, p.y, camLerp);
  },

  applyRadiantNova(x, y) {
    const { State, Utils, VFX, EntityManager, BossController, sfx } = Lumen;
    const novaR = 460;

    VFX.ring(x, y, 16, novaR, 0.65, '#ffd24a', 5);
    VFX.ring(x, y, 10, novaR * 0.72, 0.5, '#7ef9ff', 3);
    VFX.burst(x, y, '#ffd24a', 34, 310, 6, 0.75);
    VFX.shake(12);
    VFX.flash(0.35, '#fff5bd');
    VFX.callout(x, y - 28, 'RADIANT NOVA', '#ffd24a');
    if (sfx && typeof sfx.powerup === 'function') sfx.powerup();

    for (let i = State.eshots.length - 1; i >= 0; i--) {
      const s = State.eshots[i];
      if (Utils.distSq(x, y, s.x, s.y) <= novaR * novaR) {
        VFX.burst(s.x, s.y, '#7ef9ff', 3, 70, 2.5, 0.25);
        State.eshots.splice(i, 1);
      }
    }

    for (let i = State.seekers.length - 1; i >= 0; i--) {
      const sk = State.seekers[i];
      if (Utils.distSq(x, y, sk.x, sk.y) <= novaR * novaR) {
        VFX.burst(sk.x, sk.y, '#ff80ab', 8, 120, 3.5, 0.35);
        State.seekers.splice(i, 1);
        State.score += 65;
      }
    }

    for (const f of State.foes) {
      if (!f || f.dead) continue;
      if (Utils.distSq(x, y, f.x, f.y) <= novaR * novaR) {
        if (f.type === 'boss') {
          BossController.takeDamage(f, 110, f.x, f.y);
        } else {
          f.hp -= 140;
          if (f.hp <= 0 && !f.dead) {
            f.dead = true;
            EntityManager.onEnemyDeath(f);
          }
        }
      }
    }
  },

  applyAegisLight(x, y) {
    const { State, HUD, VFX, sfx } = Lumen;
    const p = State.player;
    p.shield = true;
    if (p.hp < p.maxHp) {
      p.hp += 1;
      HUD.renderLives();
    }

    VFX.ring(x, y, 10, 95, 0.45, '#7ef9ff', 3.5);
    VFX.burst(x, y, '#7ef9ff', 18, 170, 4.5, 0.5);
    VFX.callout(x, y - 28, 'AEGIS LIGHT', '#7ef9ff');
    if (sfx && typeof sfx.powerup === 'function') sfx.powerup();
  },

  takeDamage() {
    const { CONFIG, State, HUD, VFX, Game, sfx } = Lumen;
    const p = State.player;
    if (!p || State.mode !== 'playing' || p.invulnT > 0 || p.dashActiveT > 0) return;

    if (p.shield) {
      p.shield = false;
      p.invulnT = 0.9;
      VFX.ring(p.x, p.y, 12, 110, 0.45, '#7ef9ff', 4);
      VFX.burst(p.x, p.y, '#7ef9ff', 22, 210, 4.5, 0.5);
      VFX.callout(p.x, p.y - 28, 'AEGIS SHATTERED', '#7ef9ff');
      VFX.shake(8);
      if (sfx && typeof sfx.armorDeflect === 'function') sfx.armorDeflect();
      return;
    }

    p.hp = Math.max(0, p.hp - 1);
    p.invulnT = (CONFIG.PLAYER && CONFIG.PLAYER.INVULN_TIME) || 1.25;
    State.combo = 1.0;
    State.comboTimer = 0;

    HUD.renderLives();
    VFX.ring(p.x, p.y, 10, 95, 0.4, '#ff1744', 3.5);
    VFX.burst(p.x, p.y, '#ff4fa3', 24, 230, 5, 0.6);
    VFX.shake(15);
    VFX.flash(0.45, '#ff1744');
    if (sfx && typeof sfx.hit === 'function') sfx.hit();

    if (p.hp <= 0) {
      Game.gameOver();
    }
  }
};