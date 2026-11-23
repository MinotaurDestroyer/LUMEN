/**
 * js/main.js
 * Coordinates the game lifecycle (start, pause, game over), high-DPI canvas
 * resizing, main update tick, treasure drop updates, and requestAnimationFrame loop.
 */
window.Lumen = window.Lumen || {};

Lumen.Game = {
  lastFrameTime: 0,

  setControlsHintVisible(visible) {
    if (!this._controlsHintEl) {
      const candidates = document.querySelectorAll('div, footer, p, span');
      for (const el of candidates) {
        if (
          el.children.length <= 2 &&
          el.textContent &&
          el.textContent.includes('WASD / ARROWS')
        ) {
          this._controlsHintEl = el;
          break;
        }
      }
    }
    if (this._controlsHintEl) {
      this._controlsHintEl.style.display = visible ? '' : 'none';
    }
  },

  setLeftDockVisible(visible) {
    const dock = document.getElementById('hudLeftDock');
    if (!dock) return;
    dock.classList.toggle('hidden', !visible);
    dock.classList.toggle('flex', visible);
  },

  start() {
    const { State, DOM, HUD, PlayerController, EntityManager, sfx } = Lumen;
    sfx.unlock();

    State.mode = 'playing';
    State.score = 0;
    State.motes = 0;
    State.dusk = 1;
    State.duskProgress = 0;
    State.duskGoal = 100;
    State.combo = 1.0;
    State.comboTimer = 0;
    State.boss = null;
    State.bossBannerTimer = 0;
    State.slowT = 0;
    State.slowScale = 1;
    State.hitstopT = 0;
    State.winT = 0;
    State.flash = 0;
    State.shakeMag = 0;
    State.spawnTimer = 0.6;
    State.powerupTimer = 8.0;

    PlayerController.reset();
    State.cam.x = State.player.x;
    State.cam.y = State.player.y;

    State.pshots = [];
    State.eshots = [];
    State.seekers = [];
    State.foes = [];
    State.moteOrbs = [];
    State.particles = [];
    State.rings = [];
    State.callouts = [];

    if (Lumen.TreasureSystem) Lumen.TreasureSystem.reset();

    DOM.bossbar.classList.remove('show');
    HUD.hideBanner();
    this.setControlsHintVisible(false);
    this.setLeftDockVisible(true);
    DOM.bossBarFill.style.background = 'linear-gradient(90deg, #9b30ff 0%, #d500f9 45%, #ff4fa3 100%)';
    DOM.startOverlay.classList.add('hidden');
    HUD.setOverlay(DOM.pauseOverlay, false);
    HUD.setOverlay(DOM.gameOverOverlay, false);

    HUD.renderLives();
    HUD.update();

    for (let i = 0; i < 3; i++) {
      EntityManager.spawnWaveEnemy();
    }
  },

  togglePause() {
    const { State, DOM, HUD } = Lumen;
    if (State.mode === 'playing') {
      State.mode = 'paused';
      HUD.setOverlay(DOM.pauseOverlay, true);
    } else if (State.mode === 'paused') {
      State.mode = 'playing';
      HUD.setOverlay(DOM.pauseOverlay, false);
    }
  },

  toggleAutoFire() {
    const { State, DOM } = Lumen;
    State.autoFire = !State.autoFire;
    DOM.btnAutoFire.classList.toggle('active', State.autoFire);
    DOM.btnAutoFire.textContent = State.autoFire ? 'AUTO FIRE: ON' : 'AUTO FIRE: OFF';
  },

  toggleMute() {
    const { DOM, sfx } = Lumen;
    sfx.unlock();
    const isMuted = sfx.toggleMute();
    DOM.iconSoundOn.classList.toggle('hidden', isMuted);
    DOM.iconSoundOff.classList.toggle('hidden', !isMuted);
  },

  gameOver() {
    const { State, Utils, DOM, HUD, Storage } = Lumen;
    State.mode = 'gameover';
    HUD.hideBanner();
    this.setControlsHintVisible(true);
    this.setLeftDockVisible(false);
    const finalScore = Math.floor(State.score);
    let isNewRecord = false;
    if (finalScore > State.highScore) {
      State.highScore = finalScore;
      isNewRecord = true;
      Storage.saveHighScore(State.highScore);
    }

    DOM.startHighScore.textContent = State.highScore.toLocaleString();
    DOM.overScore.textContent = finalScore.toLocaleString();
    DOM.overDusk.textContent = `DUSK ${Utils.toRoman(State.dusk)}`;
    DOM.overMotes.textContent = State.motes.toLocaleString();
    DOM.overHighScore.textContent = State.highScore.toLocaleString();
    DOM.newRecordBadge.classList.toggle('hidden', !isNewRecord);

    HUD.setOverlay(DOM.gameOverOverlay, true);
  },

  handleResize() {
    const { State, DOM } = Lumen;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    State.cam.w = window.innerWidth;
    State.cam.h = window.innerHeight;
    DOM.canvas.width = Math.floor(State.cam.w * dpr);
    DOM.canvas.height = Math.floor(State.cam.h * dpr);
    DOM.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  update(rawDt) {
    const { CONFIG, State, Utils, HUD, WorldEnv, VFX, PlayerController, EntityManager } = Lumen;
    State.time += rawDt;
    WorldEnv.update(rawDt);

    if (State.mode === 'start') {
      const p = State.player;
      p.wingPhase += rawDt * 18;
      p.x = CONFIG.WORLD_W / 2 + Math.cos(State.time * 0.8) * 65;
      p.y = CONFIG.WORLD_H / 2 + Math.sin(State.time * 1.3) * 38;
      p.angle = Math.atan2(Math.cos(State.time * 1.3) * 38 * 1.3, -Math.sin(State.time * 0.8) * 65 * 0.8);
      State.cam.x = Utils.lerp(State.cam.x, p.x, rawDt * 2.5);
      State.cam.y = Utils.lerp(State.cam.y, p.y, rawDt * 2.5);
      return;
    }

    if (State.mode !== 'playing') return;

    if (State.hitstopT > 0) {
      State.hitstopT -= rawDt;
      return;
    }

    let timeScale = 1;
    if (State.slowT > 0) {
      State.slowT -= rawDt;
      timeScale = State.slowScale;
    }
    const dt = rawDt * timeScale;

    if (State.winT > 0) State.winT = Math.max(0, State.winT - rawDt);
    if (State.flash > 0) State.flash = Math.max(0, State.flash - rawDt * 1.6);
    if (State.shakeMag > 0) State.shakeMag = Math.max(0, State.shakeMag - rawDt * 42);

    if (State.bossBannerTimer > 0) {
      State.bossBannerTimer -= rawDt;
      if (State.bossBannerTimer <= 0) {
        HUD.hideBanner();
      }
    }

    if (State.comboTimer > 0) {
      State.comboTimer -= dt;
      if (State.comboTimer <= 0) State.combo = 1.0;
    }

    PlayerController.update(dt, rawDt);
    EntityManager.updatePlayerShots(dt);

    if (!State.boss && State.winT <= 0) {
      State.spawnTimer -= dt;
      const maxFoes = Math.min(12, 4 + State.dusk * 2);
      if (State.spawnTimer <= 0 && State.foes.length < maxFoes) {
        EntityManager.spawnWaveEnemy();
        State.spawnTimer = Math.max(0.55, 1.65 - State.dusk * 0.14);
      }
    }

    State.powerupTimer -= dt;
    if (State.powerupTimer <= 0) {
      State.powerupTimer = Utils.rand(12, 17);
      const p = State.player;
      const px = Utils.clamp(p.x + Utils.rand(-340, 340), 140, CONFIG.WORLD_W - 140);
      const py = Utils.clamp(p.y + Utils.rand(-260, 260), 140, CONFIG.WORLD_H - 140);
      State.moteOrbs.push(EntityManager.createMote(px, py, 'powerup', Math.random() < 0.6 ? 'nova' : 'aegis'));
    }

    EntityManager.updateFoes(dt);
    EntityManager.updateEnemyShotsAndSeekers(dt);
    EntityManager.updateMotes(dt);
    if (Lumen.TreasureSystem) Lumen.TreasureSystem.updateDrops(dt);
    VFX.update(dt);
    HUD.update();
  },

  loop(timestamp) {
    const Game = Lumen.Game;
    if (!Game.lastFrameTime) Game.lastFrameTime = timestamp;
    const rawDt = Math.min(0.05, (timestamp - Game.lastFrameTime) / 1000);
    Game.lastFrameTime = timestamp;

    Game.update(rawDt);
    Lumen.Renderer.render();

    requestAnimationFrame(Game.loop);
  },

  init() {
    const { State, DOM, HUD, InputController, Game } = Lumen;
    DOM.startHighScore.textContent = State.highScore.toLocaleString();
    window.addEventListener('resize', () => this.handleResize());
    InputController.bindEvents();
    if (Lumen.TreasureSystem) Lumen.TreasureSystem.bindUI();
    this.handleResize();
    HUD.hideBanner();
    this.setControlsHintVisible(true);
    this.setLeftDockVisible(false);
    HUD.renderLives();
    HUD.update();
    requestAnimationFrame(Game.loop);
  }
};

window.onload = function () {
  Lumen.Game.init();
};