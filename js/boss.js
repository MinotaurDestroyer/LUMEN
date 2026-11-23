/**
 * js/boss.js
 * Controls Moth Boss encounters: spawning all 16 moth species, Iridescent Wing Armor
 * burst dampening, Umbral Wing Guard stance, 3 escalating combat phases,
 * telegraphed dash-strikes, and boss treasure chest drops on defeat.
 */
window.Lumen = window.Lumen || {};

Lumen.BossController = {
  spawn() {
    const { CONFIG, State, Utils, DOM, HUD, VFX, sfx } = Lumen;
    const variant = CONFIG.BOSS_VARIANTS[(State.dusk - 1) % CONFIG.BOSS_VARIANTS.length];
    const maxHp = Math.round(CONFIG.BOSS.BASE_HP + (State.dusk - 1) * CONFIG.BOSS.HP_PER_DUSK);
    const p = State.player;

    const spawnX = Utils.clamp(p.x + Utils.rand(-140, 140), 340, CONFIG.WORLD_W - 340);
    const spawnY = Utils.clamp(p.y - 290, 240, CONFIG.WORLD_H - 360);

    const boss = {
      type: 'boss',
      mothStyle: variant.style || 'luna',
      primaryCol: variant.primaryCol || '#98f5b8',
      secondaryCol: variant.secondaryCol || '#4db678',
      accentCol: variant.accentCol || '#fff3b0',
      x: spawnX,
      y: spawnY,
      anchorX: spawnX,
      anchorY: spawnY,
      vx: 0,
      vy: 0,
      r: 58,
      hp: maxHp,
      maxHp,
      phase: 1,
      phaseShiftT: 0,
      windowDmg: 0,
      guardCd: 11.5,
      guardTimer: 0,
      guardCharge: 0,
      dashState: 'none',
      dashTimer: 0,
      dashStartX: spawnX,
      dashStartY: spawnY,
      dashEndX: spawnX,
      dashEndY: spawnY,
      mineDropTick: 0,
      evadeCd: 3.4,
      evadeTimer: 0,
      evadeDir: 1,
      col: variant.primaryCol || '#ff4fa3',
      wingPhase: 0,
      age: 0,
      patternIdx: 0,
      patternTimer: 1.8,
      streamAngle: Math.PI / 2,
      streamCount: 0,
      streamTick: 0,
      helixAngle: 0,
      helixCount: 0,
      helixTick: 0,
      hitFlash: 0,
      dead: false
    };

    State.boss = boss;
    State.foes.push(boss);

    DOM.bossBarName.textContent = variant.barName;
    DOM.bossBarFill.style.width = '100%';
    DOM.bossBarFill.style.background = `linear-gradient(90deg, ${boss.secondaryCol} 0%, ${boss.primaryCol} 65%, ${boss.accentCol} 100%)`;
    DOM.bossbar.classList.add('show');

    HUD.showBanner(variant.eyebrow, variant.title, variant.subtitle, 1.8);
    VFX.ring(spawnX, spawnY, 16, 340, 0.9, boss.primaryCol, 4);
    VFX.ring(spawnX, spawnY, 8, 220, 0.75, boss.secondaryCol, 3);
    VFX.burst(spawnX, spawnY, boss.primaryCol, 32, 240, 6, 0.9);
    VFX.shake(10);
    sfx.bossSpawn();
  },

  takeDamage(b, rawDmg, hitX, hitY) {
    const { CONFIG, VFX, sfx } = Lumen;
    if (!b || b.dead) return;

    if (b.phaseShiftT > 0) {
      VFX.burst(hitX, hitY, '#d500f9', 5, 110, 3.2, 0.3);
      sfx.armorDeflect();
      return;
    }

    let effDmg = rawDmg;

    if (b.guardTimer > 0) {
      effDmg *= CONFIG.BOSS.GUARD_DAMAGE_MULT;
      b.guardCharge += rawDmg * 0.4;
      VFX.burst(hitX, hitY, '#7ef9ff', 6, 130, 3.4, 0.35);
      sfx.armorDeflect();
    }

    const cap = CONFIG.BOSS.ARMOR_SOFT_CAP;
    const mult = CONFIG.BOSS.ARMOR_EXCESS_MULT;
    if (b.windowDmg >= cap) {
      effDmg *= mult;
      if (Math.random() < 0.35) {
        VFX.burst(hitX, hitY, '#e1bee7', 4, 95, 2.8, 0.28);
      }
    } else if (b.windowDmg + effDmg > cap) {
      const normalPart = cap - b.windowDmg;
      const excessPart = effDmg - normalPart;
      effDmg = normalPart + excessPart * mult;
    }

    b.windowDmg += effDmg;
    b.hp -= effDmg;
    b.hitFlash = 0.065;

    const hpRatio = b.hp / b.maxHp;
    if (b.phase === 1 && hpRatio <= CONFIG.BOSS.PHASE_2_THRESHOLD && b.hp > 0) {
      this.triggerPhaseTransition(b, 2);
    } else if (b.phase === 2 && hpRatio <= CONFIG.BOSS.PHASE_3_THRESHOLD && b.hp > 0) {
      this.triggerPhaseTransition(b, 3);
    }

    if (b.hp <= 0 && !b.dead) {
      b.dead = true;
      this.onDeath(b);
    }
  },

  triggerPhaseTransition(b, newPhase) {
    const { State, DOM, HUD, VFX, sfx } = Lumen;
    b.phase = newPhase;
    b.phaseShiftT = 0.95;
    b.guardTimer = 0;
    b.dashState = 'none';
    b.streamCount = 0;
    b.helixCount = 0;
    b.patternTimer = 1.15;
    b.evadeTimer = 0.45;
    b.evadeDir = Math.random() < 0.5 ? -1 : 1;

    State.pshots.forEach((p) => VFX.burst(p.x, p.y, '#d500f9', 3, 90, 3, 0.35));
    State.pshots = [];

    if (newPhase === 2) {
      HUD.showBanner('PHASE II', 'Umbral Awakening', 'Shadows Surge Across the Clearing', 1.6);
      DOM.bossBarFill.style.background = 'linear-gradient(90deg, #aa00ff 0%, #ff1744 55%, #ff4fa3 100%)';
      VFX.ring(b.x, b.y, 20, 360, 0.85, '#d500f9', 5);
      VFX.ring(b.x, b.y, 12, 240, 0.75, '#ff4fa3', 3.5);
      VFX.burst(b.x, b.y, '#d500f9', 34, 260, 6, 0.9);
      VFX.shake(14);
      VFX.flash(0.38, '#d500f9');
    } else {
      HUD.showBanner('PHASE III', 'Eclipse Frenzy', 'The Velvet Night Unleashed', 1.6);
      DOM.bossBarFill.style.background = 'linear-gradient(90deg, #ff1744 0%, #ff4fa3 50%, #ffd24a 100%)';
      VFX.ring(b.x, b.y, 24, 460, 0.95, '#ff1744', 6);
      VFX.ring(b.x, b.y, 14, 320, 0.85, '#ffd24a', 4);
      VFX.burst(b.x, b.y, '#ff1744', 42, 310, 6.5, 1.0);
      VFX.shake(18);
      VFX.flash(0.52, '#ff1744');
    }

    sfx.phaseShift();
  },

  onDeath(b) {
    const { State, Utils, DOM, VFX, EntityManager, sfx } = Lumen;
    State.boss = null;
    DOM.bossbar.classList.remove('show');
    State.slowT = 1;
    State.slowScale = 0.25;
    State.winT = 2.6;
    VFX.shake(24);
    VFX.flash(0.8, '#fff5bd');
    VFX.hitstop(0.1);
    sfx.bossDie();

    VFX.burst(b.x, b.y, b.primaryCol || '#ff4fa3', 46, 340, 8, 1);
    VFX.burst(b.x, b.y, '#ffd24a', 36, 280, 7, 1.1);
    VFX.ring(b.x, b.y, 20, 500, 0.9, b.primaryCol || '#ff4fa3', 6);
    VFX.ring(b.x, b.y, 10, 650, 1.2, '#ffd24a', 4);

    for (const f of State.foes) {
      if (!f.dead && f !== b) {
        f.dead = true;
        VFX.burst(f.x, f.y, f.col, 20, 180, 5, 0.9);
      }
    }
    State.eshots.forEach((s) => VFX.burst(s.x, s.y, s.col, 2, 80, 3, 0.3));
    State.eshots = [];
    State.seekers.forEach((sk) => VFX.burst(sk.x, sk.y, '#ff4fa3', 6, 110, 4, 0.45));
    State.seekers = [];

    for (let i = 0; i < 24; i++) {
      State.moteOrbs.push(EntityManager.createMote(b.x + Utils.rand(-40, 40), b.y + Utils.rand(-40, 40), 'mote'));
    }
    State.moteOrbs.push(EntityManager.createMote(b.x, b.y, 'powerup', Math.random() < 0.65 ? 'nova' : 'aegis'));

    if (Lumen.TreasureSystem) {
      Lumen.TreasureSystem.spawnDrop(b.x, b.y, State.dusk);
    }

    State.score += 1500 * State.dusk;
    State.dusk += 1;
    State.duskProgress = 0;
    State.duskGoal = Math.round(100 + (State.dusk - 1) * 35);
    VFX.callout(b.x, b.y - 30, `DUSK ${Utils.toRoman(State.dusk)} DAWNS`, '#ffd24a');
  },

  update(b, dt, toPlayerAng) {
    const { CONFIG, State, Utils, VFX, sfx } = Lumen;
    b.age += dt;
    const phaseSpeedMult = b.phase === 3 ? 1.48 : b.phase === 2 ? 1.24 : 1.0;
    b.wingPhase += dt * (7.2 * phaseSpeedMult);
    if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt);
    if (b.phaseShiftT > 0) b.phaseShiftT = Math.max(0, b.phaseShiftT - dt);

    b.windowDmg = Math.max(0, b.windowDmg - CONFIG.BOSS.ARMOR_DECAY_PER_SEC * dt);

    const p = State.player;
    const dPlayer = Utils.dist(b.x, b.y, p.x, p.y);

    // 1. Umbral Wing Guard Stance
    if (b.guardTimer > 0) {
      b.guardTimer -= dt;
      if (b.guardTimer <= 0) {
        b.guardTimer = 0;
        const counterCount = 14 + b.phase * 4;
        for (let i = 0; i < counterCount; i++) {
          const ang = (i / counterCount) * Utils.TAU + b.age;
          State.eshots.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(ang) * 235,
            vy: Math.sin(ang) * 235,
            r: 6.5,
            col: '#7ef9ff',
            life: 5.0
          });
        }
        VFX.ring(b.x, b.y, 24, 150, 0.45, '#7ef9ff', 3.5);
        b.guardCharge = 0;
      }
    } else if (b.dashState === 'none' && b.phaseShiftT <= 0) {
      b.guardCd -= dt;
      if (b.guardCd <= 0) {
        b.guardCd = Math.max(10.5, 14.0 - b.phase * 1.1);
        b.guardTimer = CONFIG.BOSS.GUARD_DURATION;
        b.guardCharge = 0;
        VFX.ring(b.x, b.y, 85, 34, 0.45, '#b388ff', 3.5);
        VFX.callout(b.x, b.y - 54, 'UMBRAL WING GUARD', '#b388ff');
        sfx.armorDeflect();
      }
    }

    // 2. Telegraphed Umbral Dash-Strike
    if (b.dashState !== 'none') {
      this.updateDashState(b, dt);
      return;
    }

    // 3. Movement, Lateral Evasion & Anti-Camping Repulsion
    if (b.evadeTimer > 0) {
      b.evadeTimer -= dt;
    } else {
      b.evadeCd -= dt;
      if (b.evadeCd <= 0 && b.guardTimer <= 0) {
        b.evadeCd = Utils.rand(2.8, 4.4) / phaseSpeedMult;
        b.evadeTimer = 0.42;
        b.evadeDir = Math.random() < 0.5 ? -1 : 1;
      }
    }

    const figureX = Math.sin(b.age * 0.78 * phaseSpeedMult) * 245;
    const figureY = Math.sin(b.age * 1.56 * phaseSpeedMult) * 90;
    let targetX = Utils.clamp(Utils.lerp(b.anchorX, p.x, 0.24) + figureX, 240, CONFIG.WORLD_W - 240);
    let targetY = Utils.clamp(Utils.lerp(b.anchorY, p.y - 215, 0.34) + figureY, 190, CONFIG.WORLD_H - 240);

    if (dPlayer < 235) {
      const awayAng = toPlayerAng + Math.PI;
      const push = (235 - dPlayer) * 1.45;
      targetX = Utils.clamp(targetX + Math.cos(awayAng) * push, 220, CONFIG.WORLD_W - 220);
      targetY = Utils.clamp(targetY + Math.sin(awayAng) * push, 180, CONFIG.WORLD_H - 220);
    }

    const evadeVx = b.evadeTimer > 0 ? Math.cos(toPlayerAng + Math.PI / 2) * b.evadeDir * 290 : 0;
    const evadeVy = b.evadeTimer > 0 ? Math.sin(toPlayerAng + Math.PI / 2) * b.evadeDir * 290 : 0;

    b.vx = (targetX - b.x) * (2.4 * phaseSpeedMult) + evadeVx;
    b.vy = (targetY - b.y) * (2.4 * phaseSpeedMult) + evadeVy;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // 4. Phase-Specific Attack Patterns
    const leadTime = Utils.clamp(dPlayer / 280, 0.15, 0.65);
    const leadAng = Math.atan2(
      p.y + p.vy * leadTime * 0.55 - b.y,
      p.x + p.vx * leadTime * 0.55 - b.x
    );

    b.patternTimer -= dt * phaseSpeedMult;
    if (b.patternTimer <= 0) {
      if (b.phase === 1) {
        this.runPhase1Attack(b, toPlayerAng, leadAng);
      } else if (b.phase === 2) {
        this.runPhase2Attack(b, dPlayer, toPlayerAng, leadAng);
      } else {
        this.runPhase3Attack(b, dPlayer, toPlayerAng, leadAng);
      }
    }

    this.updateStreamsAndHelix(b, dt, phaseSpeedMult);
  },

  updateDashState(b, dt) {
    const { State, Utils, VFX, sfx } = Lumen;
    if (b.dashState === 'telegraph') {
      b.dashTimer -= dt;
      b.vx *= 0.85;
      b.vy *= 0.85;
      if (b.dashTimer <= 0) {
        b.dashState = 'dashing';
        b.dashTimer = 0.42;
        b.mineDropTick = 0;
        VFX.ring(b.x, b.y, 16, 110, 0.35, '#ff1744', 4);
        VFX.burst(b.x, b.y, '#ff4fa3', 20, 220, 5, 0.5);
        sfx.bossDash();
      }
      return;
    }

    b.dashTimer -= dt;
    const progress = Utils.clamp(1 - b.dashTimer / 0.42, 0, 1);
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    b.x = Utils.lerp(b.dashStartX, b.dashEndX, ease);
    b.y = Utils.lerp(b.dashStartY, b.dashEndY, ease);

    b.mineDropTick -= dt;
    if (b.mineDropTick <= 0) {
      b.mineDropTick = 0.065;
      const perp = Math.atan2(b.dashEndY - b.dashStartY, b.dashEndX - b.dashStartX) + Math.PI / 2;
      const side = Math.random() < 0.5 ? -1 : 1;
      State.eshots.push({
        x: b.x + Math.cos(perp) * side * 18,
        y: b.y + Math.sin(perp) * side * 18,
        vx: Math.cos(perp) * side * 42,
        vy: Math.sin(perp) * side * 42,
        r: 6.5,
        col: '#d500f9',
        life: 4.8
      });
      VFX.burst(b.x, b.y, '#ff4fa3', 4, 80, 3.5, 0.35);
    }

    if (b.dashTimer <= 0) {
      b.dashState = 'none';
      b.anchorX = b.x;
      b.anchorY = b.y;
      b.patternTimer = 0.75;
      const ringCount = b.phase === 3 ? 16 : 12;
      for (let i = 0; i < ringCount; i++) {
        const ang = (i / ringCount) * Utils.TAU;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 210,
          vy: Math.sin(ang) * 210,
          r: 6.5,
          col: '#ff4fa3',
          life: 5.0
        });
      }
    }
  },

  beginDashTelegraph(b, dPlayer, telegraphTime, extraDist, maxDist, nextPatternDelay) {
    const { CONFIG, State, Utils } = Lumen;
    const p = State.player;
    b.dashState = 'telegraph';
    b.dashTimer = telegraphTime;
    b.dashStartX = b.x;
    b.dashStartY = b.y;
    const dashAng = Math.atan2(p.y - b.y, p.x - b.x);
    const dashDist = Utils.clamp(dPlayer + extraDist, 340, maxDist);
    b.dashEndX = Utils.clamp(b.x + Math.cos(dashAng) * dashDist, 200, CONFIG.WORLD_W - 200);
    b.dashEndY = Utils.clamp(b.y + Math.sin(dashAng) * dashDist, 180, CONFIG.WORLD_H - 200);
    b.patternTimer = nextPatternDelay;
  },

  runPhase1Attack(b, toPlayerAng, leadAng) {
    const { State, Utils, VFX } = Lumen;
    b.patternIdx = (b.patternIdx + 1) % 3;
    if (b.patternIdx === 0) {
      b.patternTimer = 2.0;
      const petals = 16;
      for (let i = 0; i < petals; i++) {
        const ang = (i / petals) * Utils.TAU + b.age;
        const spd = 195 + (i % 2) * 42;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 6.5,
          col: i % 2 === 0 ? '#ff4fa3' : '#d500f9',
          life: 5.5
        });
      }
      VFX.ring(b.x, b.y, 18, 115, 0.42, '#ff4fa3', 3);
    } else if (b.patternIdx === 1) {
      b.patternTimer = 1.85;
      for (let i = -2; i <= 2; i++) {
        const ang = toPlayerAng + i * 0.17;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 235,
          vy: Math.sin(ang) * 235,
          r: 6.5,
          col: '#ff4fa3',
          life: 5.2
        });
      }
      for (let k = -1; k <= 1; k += 2) {
        const ang = leadAng + k * 0.08;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 275,
          vy: Math.sin(ang) * 275,
          r: 6.8,
          col: '#ffd24a',
          life: 5.0
        });
      }
    } else {
      b.patternTimer = 2.3;
      b.streamAngle = toPlayerAng - 0.6;
      b.streamCount = 12;
      b.streamTick = 0;
    }
  },

  runPhase2Attack(b, dPlayer, toPlayerAng, leadAng) {
    const { CONFIG, State, Utils, VFX } = Lumen;
    b.patternIdx = (b.patternIdx + 1) % 4;
    if (b.patternIdx === 0 && b.guardTimer <= 0) {
      this.beginDashTelegraph(b, dPlayer, 0.85, 190, 560, 1.6);
    } else if (b.patternIdx === 1) {
      b.patternTimer = 2.15;
      const count = 20;
      const gapCenter = toPlayerAng + Utils.rand(-0.35, 0.35);
      for (let layer = 0; layer < 2; layer++) {
        const offset = layer * 0.32;
        const spd = 205 + layer * 55;
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Utils.TAU + offset;
          let diff = ang - (gapCenter + offset);
          while (diff > Math.PI) diff -= Utils.TAU;
          while (diff < -Math.PI) diff += Utils.TAU;
          if (Math.abs(diff) < 0.24) continue;
          State.eshots.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            r: 6.5,
            col: layer === 0 ? '#ff4fa3' : '#d500f9',
            life: 5.5
          });
        }
      }
      VFX.ring(b.x, b.y, 20, 140, 0.45, '#d500f9', 3.5);
    } else if (b.patternIdx === 2) {
      b.patternTimer = 1.9;
      if (State.foes.length < 5) {
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? -1 : 1;
          const sx = Utils.clamp(b.x + side * 125, 120, CONFIG.WORLD_W - 120);
          const sy = Utils.clamp(b.y + 45, 120, CONFIG.WORLD_H - 120);
          const isWisp = s % 2 === 1;
          State.foes.push({
            type: isWisp ? 'wisp' : 'moth',
            x: sx,
            y: sy,
            vx: side * 80,
            vy: 40,
            r: isWisp ? 17 : 20,
            hp: Math.round(28 * (1 + (State.dusk - 1) * 0.2)),
            maxHp: Math.round(28 * (1 + (State.dusk - 1) * 0.2)),
            col: isWisp ? '#64ffda' : '#ff4fa3',
            accent: '#d500f9',
            phase: Utils.rand(0, Utils.TAU),
            fireCd: Utils.rand(1.0, 1.8),
            moteDrop: 1,
            duskVal: 0,
            scoreVal: 100,
            hitFlash: 0,
            dead: false
          });
          VFX.burst(sx, sy, '#d500f9', 12, 120, 4, 0.5);
        }
      }
      for (let i = -3; i <= 3; i++) {
        const ang = leadAng + i * 0.14;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 245,
          vy: Math.sin(ang) * 245,
          r: 6.5,
          col: '#ff4fa3',
          life: 5.2
        });
      }
    } else {
      b.patternTimer = 2.2;
      b.streamAngle = toPlayerAng - 0.7;
      b.streamCount = 15;
      b.streamTick = 0;
    }
  },

  runPhase3Attack(b, dPlayer, toPlayerAng, leadAng) {
    const { State, Utils, VFX } = Lumen;
    b.patternIdx = (b.patternIdx + 1) % 4;
    if (b.patternIdx === 0) {
      b.patternTimer = 2.4;
      b.helixAngle = toPlayerAng;
      b.helixCount = 16;
      b.helixTick = 0;
    } else if (b.patternIdx === 1) {
      b.patternTimer = 2.1;
      if (State.seekers.length < 5) {
        for (let k = -1; k <= 1; k++) {
          const ang = toPlayerAng + k * 0.65;
          State.seekers.push({
            x: b.x + Math.cos(ang) * 34,
            y: b.y + Math.sin(ang) * 34,
            vx: Math.cos(ang) * 195,
            vy: Math.sin(ang) * 195,
            speed: 205 + Math.min(45, State.dusk * 8),
            r: 9,
            hp: 18,
            phase: Utils.rand(0, Utils.TAU),
            life: 5.5
          });
        }
      }
      const bloom = 18;
      for (let i = 0; i < bloom; i++) {
        const ang = (i / bloom) * Utils.TAU + b.age * 1.2;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 245,
          vy: Math.sin(ang) * 245,
          r: 6.8,
          col: i % 2 === 0 ? '#ff1744' : '#ff4fa3',
          life: 5.2
        });
      }
      VFX.ring(b.x, b.y, 18, 150, 0.4, '#ff1744', 3.5);
    } else if (b.patternIdx === 2 && b.guardTimer <= 0) {
      this.beginDashTelegraph(b, dPlayer, 0.68, 210, 600, 1.4);
    } else {
      b.patternTimer = 1.75;
      for (let i = -3; i <= 3; i++) {
        const ang = leadAng + i * 0.13;
        State.eshots.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * 275,
          vy: Math.sin(ang) * 275,
          r: 6.5,
          col: '#ff1744',
          life: 5.0
        });
      }
    }
  },

  updateStreamsAndHelix(b, dt, phaseSpeedMult) {
    const { State } = Lumen;
    if (b.streamCount > 0) {
      b.streamTick -= dt * phaseSpeedMult;
      if (b.streamTick <= 0) {
        b.streamTick = 0.105;
        b.streamCount -= 1;
        b.streamAngle += 0.115;
        for (const offset of [-0.28, 0.28]) {
          const ang = b.streamAngle + offset;
          State.eshots.push({
            x: b.x + Math.cos(ang) * 26,
            y: b.y + Math.sin(ang) * 26,
            vx: Math.cos(ang) * 250,
            vy: Math.sin(ang) * 250,
            r: 6.5,
            col: '#ff4fa3',
            life: 5.2
          });
        }
      }
    }

    if (b.helixCount > 0) {
      b.helixTick -= dt;
      if (b.helixTick <= 0) {
        b.helixTick = 0.095;
        b.helixCount -= 1;
        b.helixAngle += 0.19;
        for (let arm = 0; arm < 2; arm++) {
          const cwAng = b.helixAngle + arm * Math.PI;
          const ccwAng = -b.helixAngle + arm * Math.PI;
          State.eshots.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(cwAng) * 235,
            vy: Math.sin(cwAng) * 235,
            r: 6.3,
            col: '#ff4fa3',
            life: 5.2
          });
          State.eshots.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(ccwAng) * 215,
            vy: Math.sin(ccwAng) * 215,
            r: 6.3,
            col: '#d500f9',
            life: 5.2
          });
        }
      }
    }
  }
};