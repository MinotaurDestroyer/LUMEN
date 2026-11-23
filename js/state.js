/**
 * js/state.js
 * Centralized mutable game state, camera state, player state, entity pools,
 * treasure inventory, 6-slot puzzle state, and localStorage persistence.
 */
window.Lumen = window.Lumen || {};

Lumen.Storage = {
  loadHighScore() {
    try {
      return parseInt(localStorage.getItem(Lumen.CONFIG.STORAGE_KEY) || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  },

  saveHighScore(score) {
    try {
      localStorage.setItem(Lumen.CONFIG.STORAGE_KEY, String(score));
    } catch (e) {}
  }
};

Lumen.State = {
  mode: 'start', // 'start' | 'playing' | 'paused' | 'gameover'
  highScore: Lumen.Storage.loadHighScore(),
  time: 0,
  score: 0,
  motes: 0,
  dusk: 1,
  duskProgress: 0,
  duskGoal: 100,
  combo: 1.0,
  comboTimer: 0,
  autoFire: true,
  boss: null,
  bossBannerTimer: 0,
  slowT: 0,
  slowScale: 1,
  hitstopT: 0,
  winT: 0,
  flash: 0,
  flashCol: '#fff5bd',
  shakeMag: 0,
  spawnTimer: 0.8,
  powerupTimer: 9.0,

  cam: {
    x: Lumen.CONFIG.WORLD_W / 2,
    y: Lumen.CONFIG.WORLD_H / 2,
    w: window.innerWidth,
    h: window.innerHeight
  },

  player: {
    x: Lumen.CONFIG.WORLD_W / 2,
    y: Lumen.CONFIG.WORLD_H / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    hp: Lumen.CONFIG.PLAYER.MAX_HP,
    maxHp: Lumen.CONFIG.PLAYER.MAX_HP,
    shield: false,
    weaponTier: 0,
    fireTimer: 0,
    invulnT: 0,
    dashCd: 0,
    dashMaxCd: Lumen.CONFIG.PLAYER.DASH_CD,
    dashActiveT: 0,
    wingPhase: 0,
    trail: []
  },

  // Active Entity Pools
  pshots: [],    // Player luminous bolts
  eshots: [],    // Enemy plasma projectiles
  seekers: [],   // Shootable homing shadow-seeker spores
  foes: [],      // Enemies & active boss
  moteOrbs: [],  // Collectible golden-green motes & power-up orbs
  particles: [], // Additive glow particles
  rings: [],     // Expanding shockwaves
  callouts: [],  // Floating world text notifications

  // Boss Treasure & 6-Item Puzzle State
  treasureDrops: [],
  inventory: [],
  puzzleSlots: [null, null, null, null, null, null],
  activeOpenedTreasure: null,
  puzzleSolved: false,
  newPuzzleAlert: false,
  pausedFromOverlay: false
};