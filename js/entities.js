/**
 * js/entities.js
 * Manages enemy wave spawning, enemy movement/shooting AI, player & enemy
 * projectile collisions, shootable Shadow-Seeker spores, and magnetic Lumen motes.
 */
window.Lumen = window.Lumen || {};

Lumen.EntityManager = {
  createMote(x, y, kind = 'mote', powerType = 'nova') {
    const { rand, TAU } = Lumen.Utils;
    const ang = rand(0, TAU);
    const spd = kind === 'powerup' ? rand(35, 70) : rand(65, 190);
    return {
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      kind,
      powerType,
      r: kind === 'powerup' ? 14 : 6.5,
      phase: rand(0, TAU),
      life: kind === 'powerup' ? 18 : 22
    };
  },

  spawnWaveEnemy() {
    const { CONFIG, State, Utils } = Lumen;
    const p = State.player;
    const ang = Utils.rand(0, Utils.TAU);
    const spawnDist = Math.max(State.cam.w, State.cam.h) * 0.58 + 90;
    const sx = Utils.clamp(p.x + Math.cos(ang) * spawnDist, 90, CONFIG.WORLD_W - 90);
    const sy = Utils.clamp(p.y + Math.sin(ang) * spawnDist, 90, CONFIG.WORLD_H - 90);

    const hpScale = 1 + (State.dusk - 1) * 0.24;
    const roll = Math.random();

    if (roll < 0.36) {
      State.foes.push({
        type: 'moth',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: 21,
        hp: Math.round(28 * hpScale),
        maxHp: Math.round(28 * hpScale),
        col: '#ff4fa3',
        accent: '#d500f9',
        phase: Utils.rand(0, Utils.TAU),
        fireCd: Utils.rand(1.1, 2.0),
        moteDrop: 2,
        duskVal: 9,
        scoreVal: 120,
        hitFlash: 0,
        dead: false
      });
    } else if (roll < 0.64) {
      State.foes.push({
        type: 'wisp',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: 18,
        hp: Math.round(22 * hpScale),
        maxHp: Math.round(22 * hpScale),
        col: '#64ffda',
        accent: '#00b8d4',
        phase: Utils.rand(0, Utils.TAU),
        fireCd: Utils.rand(1.3, 2.2),
        moteDrop: 2,
        duskVal: 8,
        scoreVal: 110,
        hitFlash: 0,
        dead: false
      });
    } else if (roll < 0.85) {
      State.foes.push({
        type: 'beetle',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: 25,
        hp: Math.round(52 * hpScale),
        maxHp: Math.round(52 * hpScale),
        col: '#b388ff',
        accent: '#7c4dff',
        phase: Utils.rand(0, Utils.TAU),
        fireCd: Utils.rand(1.7, 2.6),
        moteDrop: 3,
        duskVal: 13,
        scoreVal: 180,
        hitFlash: 0,
        dead: false
      });
    } else {
      State.foes.push({
        type: 'stalker',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: 20,
        hp: Math.round(34 * hpScale),
        maxHp: Math.round(34 * hpScale),
        col: '#ff80ab',
        accent: '#f50057',
        phase: Utils.rand(0, Utils.TAU),
        fireCd: Utils.rand(1.0, 1.8),
        moteDrop: 3,
        duskVal: 11,
        scoreVal: 160,
        hitFlash: 0,
        dead: false
      });
    }
  },

  onEnemyDeath(f) {
    const { State, Utils, VFX, BossController, sfx } = Lumen;
    const mult = 1 + (State.dusk - 1) * 0.15;
    State.score += Math.round(f.scoreVal * mult * State.combo);
    State.combo = Utils.clamp(State.combo + 0.15, 1.0, 4.0);
    State.comboTimer = 3.2;

    if (!State.boss) {
      State.duskProgress += f.duskVal || 9;
      if (State.duskProgress >= State.duskGoal) {
        State.duskProgress = State.duskGoal;
        BossController.spawn();
      }
    }

    VFX.burst(f.x, f.y, f.col, 16, 175, 4.5, 0.5);
    VFX.ring(f.x, f.y, 6, 46, 0.32, f.col, 2.5);
    sfx.enemyDie();

    const drops = f.moteDrop || 2;
    for (let i = 0; i < drops; i++) {
      State.moteOrbs.push(this.createMote(f.x, f.y, 'mote'));
    }

    if (Math.random() < 0.085) {
      State.moteOrbs.push(this.createMote(f.x, f.y, 'powerup', Math.random() < 0.58 ? 'nova' : 'aegis'));
    }
  },

  updatePlayerShots(dt) {
    const { CONFIG, State, Utils, VFX, BossController, sfx } = Lumen;
    for (let i = State.pshots.length - 1; i >= 0; i--) {
      const b = State.pshots[i];
      if (!b) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < 0 || b.x > CONFIG.WORLD_W || b.y < 0 || b.y > CONFIG.WORLD_H) {
        State.pshots.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const f of State.foes) {
        if (!f || f.dead) continue;
        const hitR = f.r + 6;
        if (Utils.distSq(b.x, b.y, f.x, f.y) <= hitR * hitR) {
          if (f.type === 'boss') {
            BossController.takeDamage(f, b.dmg, b.x, b.y);
            if (i >= State.pshots.length) {
              i = State.pshots.length;
              hit = true;
              break;
            }
          } else {
            f.hp -= b.dmg;
            if (f.hitFlash !== undefined) f.hitFlash = 0.08;
            VFX.burst(b.x, b.y, b.col, 4, 95, 3, 0.25);
            if (f.hp <= 0 && !f.dead) {
              f.dead = true;
              this.onEnemyDeath(f);
            }
          }
          if (i < State.pshots.length) State.pshots.splice(i, 1);
          hit = true;
          break;
        }
      }

      if (!hit && i < State.pshots.length) {
        for (let k = State.seekers.length - 1; k >= 0; k--) {
          const sk = State.seekers[k];
          if (!sk) continue;
          if (Utils.distSq(b.x, b.y, sk.x, sk.y) <= (sk.r + 7) * (sk.r + 7)) {
            sk.hp -= b.dmg;
            VFX.burst(b.x, b.y, '#ff80ab', 5, 110, 3, 0.3);
            State.pshots.splice(i, 1);
            if (sk.hp <= 0) {
              State.score += 65;
              sfx.enemyDie();
              VFX.burst(sk.x, sk.y, '#ff4fa3', 14, 160, 4.5, 0.5);
              VFX.ring(sk.x, sk.y, 4, 34, 0.3, '#ff80ab', 2);
              State.seekers.splice(k, 1);
            }
            break;
          }
        }
      }
    }
  },

  updateFoes(dt) {
    const { CONFIG, State, Utils, BossController, PlayerController } = Lumen;
    const p = State.player;
    for (let i = State.foes.length - 1; i >= 0; i--) {
      const f = State.foes[i];
      if (!f || f.dead) {
        if (f) State.foes.splice(i, 1);
        continue;
      }

      const toPlayerAng = Math.atan2(p.y - f.y, p.x - f.x);

      if (f.type === 'boss') {
        BossController.update(f, dt, toPlayerAng);
      } else {
        f.phase += dt * 5.5;
        if (f.hitFlash > 0) f.hitFlash = Math.max(0, f.hitFlash - dt);

        const d = Utils.dist(f.x, f.y, p.x, p.y);
        const preferredDist = f.type === 'beetle' ? 160 : f.type === 'stalker' ? 190 : 250;
        const radialSpd = d > preferredDist ? 125 : d < preferredDist - 55 ? -75 : 15;
        const orbitDir = f.type === 'wisp' ? 1 : f.type === 'stalker' ? Math.sin(f.phase * 0.5) : 0.35;
        const orbitSpd = (f.type === 'stalker' ? 145 : 85) * orbitDir;

        f.vx = Math.cos(toPlayerAng) * radialSpd + Math.cos(toPlayerAng + Math.PI / 2) * orbitSpd;
        f.vy = Math.sin(toPlayerAng) * radialSpd + Math.sin(toPlayerAng + Math.PI / 2) * orbitSpd;
        f.x = Utils.clamp(f.x + f.vx * dt, 60, CONFIG.WORLD_W - 60);
        f.y = Utils.clamp(f.y + f.vy * dt, 60, CONFIG.WORLD_H - 60);

        f.fireCd -= dt;
        if (f.fireCd <= 0 && d < 680) {
          if (f.type === 'beetle') {
            f.fireCd = Utils.rand(2.1, 2.9);
            for (let k = -1; k <= 1; k++) {
              const ang = toPlayerAng + k * 0.24;
              State.eshots.push({
                x: f.x,
                y: f.y,
                vx: Math.cos(ang) * 195,
                vy: Math.sin(ang) * 195,
                r: 6.5,
                col: '#ff4fa3',
                life: 4.5
              });
            }
          } else if (f.type === 'wisp') {
            f.fireCd = Utils.rand(1.7, 2.4);
            for (const off of [-0.14, 0.14]) {
              const ang = toPlayerAng + off;
              State.eshots.push({
                x: f.x,
                y: f.y,
                vx: Math.cos(ang) * 215,
                vy: Math.sin(ang) * 215,
                r: 6,
                col: '#ff4fa3',
                life: 4.5
              });
            }
          } else {
            f.fireCd = Utils.rand(1.5, 2.3);
            State.eshots.push({
              x: f.x,
              y: f.y,
              vx: Math.cos(toPlayerAng) * 220,
              vy: Math.sin(toPlayerAng) * 220,
              r: 6.2,
              col: '#ff4fa3',
              life: 4.5
            });
          }
        }
      }

      const bodyR = f.r * 0.78 + 10;
      if (Utils.distSq(f.x, f.y, p.x, p.y) <= bodyR * bodyR) {
        PlayerController.takeDamage();
      }
    }
  },

  updateEnemyShotsAndSeekers(dt) {
    const { CONFIG, State, Utils, VFX, PlayerController } = Lumen;
    const p = State.player;

    for (let i = State.eshots.length - 1; i >= 0; i--) {
      const s = State.eshots[i];
      if (!s) continue;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;

      if (s.life <= 0 || s.x < 0 || s.x > CONFIG.WORLD_W || s.y < 0 || s.y > CONFIG.WORLD_H) {
        State.eshots.splice(i, 1);
        continue;
      }

      const hitR = s.r * 0.65 + 6;
      if (Utils.distSq(s.x, s.y, p.x, p.y) <= hitR * hitR) {
        VFX.burst(s.x, s.y, s.col, 8, 120, 3.5, 0.4);
        State.eshots.splice(i, 1);
        PlayerController.takeDamage();
      }
    }

    for (let i = State.seekers.length - 1; i >= 0; i--) {
      const sk = State.seekers[i];
      if (!sk) continue;
      sk.life -= dt;
      sk.phase += dt * 9;
      if (sk.life <= 0) {
        VFX.burst(sk.x, sk.y, '#ff4fa3', 8, 100, 3.5, 0.4);
        State.seekers.splice(i, 1);
        continue;
      }

      const desiredAng = Math.atan2(p.y - sk.y, p.x - sk.x);
      const curAng = Math.atan2(sk.vy, sk.vx);
      let diff = desiredAng - curAng;
      while (diff > Math.PI) diff -= Utils.TAU;
      while (diff < -Math.PI) diff += Utils.TAU;
      const turnRate = 2.35;
      const newAng = curAng + Utils.clamp(diff, -turnRate * dt, turnRate * dt);
      sk.vx = Math.cos(newAng) * sk.speed;
      sk.vy = Math.sin(newAng) * sk.speed;
      sk.x += sk.vx * dt;
      sk.y += sk.vy * dt;

      if (Math.random() < 0.45) {
        State.particles.push({
          x: sk.x,
          y: sk.y,
          vx: Utils.rand(-25, 25),
          vy: Utils.rand(-25, 25),
          r: 2.5,
          col: '#ff1744',
          life: 0.25,
          maxLife: 0.25,
          drag: 0.9
        });
      }

      const hitR = sk.r * 0.72 + 6;
      if (Utils.distSq(sk.x, sk.y, p.x, p.y) <= hitR * hitR) {
        VFX.burst(sk.x, sk.y, '#ff1744', 12, 140, 4, 0.45);
        State.seekers.splice(i, 1);
        PlayerController.takeDamage();
      }
    }
  },

  updateMotes(dt) {
    const { CONFIG, State, Utils, VFX, PlayerController, sfx } = Lumen;
    const p = State.player;
    const magnetR = CONFIG.PLAYER.MAGNET_RADIUS;

    for (let i = State.moteOrbs.length - 1; i >= 0; i--) {
      const m = State.moteOrbs[i];
      if (!m) continue;
      m.life -= dt;
      m.phase += dt * 6;
      if (m.life <= 0) {
        State.moteOrbs.splice(i, 1);
        continue;
      }

      m.vx *= Math.pow(0.08, dt);
      m.vy *= Math.pow(0.08, dt);

      const d = Utils.dist(m.x, m.y, p.x, p.y);
      if (m.kind === 'mote' && d < magnetR) {
        const pull = (1 - d / magnetR) * 560;
        const ang = Math.atan2(p.y - m.y, p.x - m.x);
        m.vx += Math.cos(ang) * pull * dt * 8;
        m.vy += Math.sin(ang) * pull * dt * 8;
      }

      m.x = Utils.clamp(m.x + m.vx * dt, 40, CONFIG.WORLD_W - 40);
      m.y = Utils.clamp(m.y + m.vy * dt, 40, CONFIG.WORLD_H - 40);

      if (d <= m.r + 18) {
        if (m.kind === 'powerup') {
          if (m.powerType === 'nova') {
            PlayerController.applyRadiantNova(m.x, m.y);
          } else {
            PlayerController.applyAegisLight(m.x, m.y);
          }
        } else {
          State.motes += 1;
          State.score += Math.round(25 * State.combo);
          State.comboTimer = Math.max(State.comboTimer, 2.4);
          VFX.burst(m.x, m.y, '#ffd24a', 5, 75, 2.6, 0.3);
          sfx.mote(State.combo);
        }
        State.moteOrbs.splice(i, 1);
      }
    }
  }
};