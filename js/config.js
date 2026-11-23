/**
 * js/config.js
 * Global constants, balancing parameters, weapon tiers, Dusk region metadata,
 * and all 16 Moth Boss species definitions.
 */
window.Lumen = window.Lumen || {};

Lumen.CONFIG = {
  WORLD_W: 2400,
  WORLD_H: 1800,
  STORAGE_KEY: 'lumen_firefly_highscore_v1',

  PLAYER: {
    MAX_HP: 5,
    MAX_SPEED: 355,
    ACCEL: 11.5,
    DASH_SPEED: 760,
    DASH_CD: 2.2,
    DASH_DURATION: 0.24,
    PULSE_RADIUS: 175,
    MAGNET_RADIUS: 195
  },

  BOSS: {
    BASE_HP: 2200,
    HP_PER_DUSK: 1100,
    PHASE_2_THRESHOLD: 0.65,
    PHASE_3_THRESHOLD: 0.30,
    ARMOR_SOFT_CAP: 28,
    ARMOR_EXCESS_MULT: 0.28,
    ARMOR_DECAY_PER_SEC: 460,
    GUARD_DURATION: 3.0,
    GUARD_DAMAGE_MULT: 0.35
  },

  DUSK_REGIONS: [
    'THE WHISPERING GLADE',
    'MOSSBOUND HOLLOW',
    'SILVERFERN CANOPY',
    'TWILIGHT SANCTUARY',
    'STARLIT MIRE',
    'EMERALD ABYSS',
    'MOONLIT THICKET',
    'THE ETERNAL DUSK'
  ],

  BOSS_VARIANTS: [
    {
      style: 'luna',
      barName: 'LUNA MOTH',
      eyebrow: 'DUSK I GUARDIAN',
      title: 'Luna Moth',
      subtitle: 'Pale Empress of the Whispering Glade',
      primaryCol: '#98f5b8',
      secondaryCol: '#4db678',
      accentCol: '#fff3b0'
    },
    {
      style: 'atlas',
      barName: 'ATLAS MOTH',
      eyebrow: 'DUSK II GUARDIAN',
      title: 'Atlas Moth',
      subtitle: 'Titan of the Crimson Canopy',
      primaryCol: '#d95f26',
      secondaryCol: '#f2b880',
      accentCol: '#fff5e4'
    },
    {
      style: 'rosy_maple',
      barName: 'ROSY MAPLE MOTH',
      eyebrow: 'DUSK III GUARDIAN',
      title: 'Rosy Maple Moth',
      subtitle: 'Weaver of Dawn Petal & Gold',
      primaryCol: '#ff7eb6',
      secondaryCol: '#ffe66d',
      accentCol: '#fff3b0'
    },
    {
      style: 'deaths_head',
      barName: "DEATH'S-HEAD MOTH",
      eyebrow: 'DUSK IV GUARDIAN',
      title: "Death's-Head Moth",
      subtitle: 'Harbinger of the Hollow Night',
      primaryCol: '#ffc93c',
      secondaryCol: '#3d2b24',
      accentCol: '#f8f9fa'
    },
    {
      style: 'tiger',
      barName: 'TIGER MOTH',
      eyebrow: 'DUSK V GUARDIAN',
      title: 'Tiger Moth',
      subtitle: 'Striped Ember of the Briar',
      primaryCol: '#ff7315',
      secondaryCol: '#1b1b22',
      accentCol: '#ffd166'
    },
    {
      style: 'cecropia',
      barName: 'CECROPIA MOTH',
      eyebrow: 'DUSK VI GUARDIAN',
      title: 'Cecropia Moth',
      subtitle: 'Sovereign of the Bioluminescent Mist',
      primaryCol: '#64dfdf',
      secondaryCol: '#9e473b',
      accentCol: '#ff4d6d'
    },
    {
      style: 'polyphemus',
      barName: 'POLYPHEMUS MOTH',
      eyebrow: 'DUSK VII GUARDIAN',
      title: 'Polyphemus Moth',
      subtitle: 'Watcher with Twin Azure Eyes',
      primaryCol: '#d4a373',
      secondaryCol: '#8d6e63',
      accentCol: '#4cc9f0'
    },
    {
      style: 'peppered',
      barName: 'PEPPERED MOTH',
      eyebrow: 'DUSK VIII GUARDIAN',
      title: 'Peppered Moth',
      subtitle: 'Phantom of the Pale Birch',
      primaryCol: '#f1f5f9',
      secondaryCol: '#94a3b8',
      accentCol: '#1e293b'
    },
    {
      style: 'sunset',
      barName: 'SUNSET MOTH',
      eyebrow: 'DUSK IX GUARDIAN',
      title: 'Sunset Moth',
      subtitle: 'Prism Wing of the Twilight Horizon',
      primaryCol: '#2ec4b6',
      secondaryCol: '#ff006e',
      accentCol: '#ffbe0b'
    },
    {
      style: 'elephant_hawk',
      barName: 'ELEPHANT HAWK-MOTH',
      eyebrow: 'DUSK X GUARDIAN',
      title: 'Elephant Hawk-Moth',
      subtitle: 'Dart of Moss & Magenta',
      primaryCol: '#e83f8e',
      secondaryCol: '#9bb83b',
      accentCol: '#7ef9ff'
    },
    {
      style: 'comet',
      barName: 'COMET MOTH',
      eyebrow: 'DUSK XI GUARDIAN',
      title: 'Comet Moth',
      subtitle: 'Trailing Star of the Deep Clearing',
      primaryCol: '#ffd60a',
      secondaryCol: '#f48c06',
      accentCol: '#b5332a'
    },
    {
      style: 'silk',
      barName: 'SILK MOTH',
      eyebrow: 'DUSK XII GUARDIAN',
      title: 'Silk Moth',
      subtitle: 'Seraph of the Ivory Cocoon',
      primaryCol: '#f8f4e8',
      secondaryCol: '#dfd3be',
      accentCol: '#ffd24a'
    },
    {
      style: 'brimstone',
      barName: 'BRIMSTONE MOTH',
      eyebrow: 'DUSK XIII GUARDIAN',
      title: 'Brimstone Moth',
      subtitle: 'Gilded Leaf of the Night Wind',
      primaryCol: '#ffe64d',
      secondaryCol: '#f4a261',
      accentCol: '#e76f51'
    },
    {
      style: 'jersey_tiger',
      barName: 'JERSEY TIGER MOTH',
      eyebrow: 'DUSK XIV GUARDIAN',
      title: 'Jersey Tiger Moth',
      subtitle: 'Zebra-Veiled Scarlet Dancer',
      primaryCol: '#ff4d6d',
      secondaryCol: '#181820',
      accentCol: '#ffffff'
    },
    {
      style: 'cinnabar',
      barName: 'CINNABAR MOTH',
      eyebrow: 'DUSK XV GUARDIAN',
      title: 'Cinnabar Moth',
      subtitle: 'Crimson-Edged Shadow',
      primaryCol: '#e63946',
      secondaryCol: '#1e1e24',
      accentCol: '#ff758f'
    },
    {
      style: 'hawk',
      barName: 'HAWK-MOTH',
      eyebrow: 'DUSK XVI GUARDIAN',
      title: 'Hawk-Moth',
      subtitle: 'Swift Gale of the Amber Dusk',
      primaryCol: '#c97b4b',
      secondaryCol: '#6f3b22',
      accentCol: '#f4a261'
    }
  ],

  WEAPON_TIERS: [
    { name: 'EMBER', rate: 0.145, dmg: 13 },
    { name: 'GLEAM', rate: 0.135, dmg: 11 },
    { name: 'RADIANCE', rate: 0.125, dmg: 10 },
    { name: 'SOLARIS', rate: 0.115, dmg: 9.5 },
    { name: 'ASTRAL', rate: 0.105, dmg: 9 }
  ]
};