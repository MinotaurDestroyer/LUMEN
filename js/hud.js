/**
 * js/hud.js
 * Caches DOM elements and manages updates to the heads-up display,
 * boss health bar, boss phase badges, dramatic banners, and modal overlays.
 */
window.Lumen = window.Lumen || {};

Lumen.DOM = {
  canvas: document.getElementById('gameCanvas'),
  ctx: document.getElementById('gameCanvas').getContext('2d'),
  miniCanvas: document.getElementById('minimapCanvas'),
  miniCtx: document.getElementById('minimapCanvas').getContext('2d'),

  duskTitle: document.getElementById('hudDuskTitle'),
  duskSub: document.getElementById('hudDuskSub'),
  lives: document.getElementById('hudLives'),
  progressFill: document.getElementById('hudProgressFill'),
  weaponTier: document.getElementById('hudWeaponTier'),
  shieldBadge: document.getElementById('hudShieldBadge'),
  dashFill: document.getElementById('hudDashFill'),
  score: document.getElementById('hudScore'),
  motes: document.getElementById('hudMotes'),
  comboWrap: document.getElementById('hudComboWrap'),
  combo: document.getElementById('hudCombo'),

  bossbar: document.getElementById('bossBarContainer'),
  bossBarName: document.getElementById('bossBarName'),
  bossPhaseTag: document.getElementById('bossPhaseTag'),
  bossBarFill: document.getElementById('bossBarFill'),
  bossBanner: document.getElementById('bossBanner'),
  bossBannerEyebrow: document.getElementById('bossBannerEyebrow'),
  bossBannerTitle: document.getElementById('bossBannerTitle'),
  bossBannerSub: document.getElementById('bossBannerSub'),

  btnAutoFire: document.getElementById('btnAutoFire'),
  btnMute: document.getElementById('btnMute'),
  iconSoundOn: document.getElementById('iconSoundOn'),
  iconSoundOff: document.getElementById('iconSoundOff'),
  btnPause: document.getElementById('btnPause'),

  touchControls: document.getElementById('touchControls'),
  touchStickZone: document.getElementById('touchStickZone'),
  touchStickKnob: document.getElementById('touchStickKnob'),
  touchDashBtn: document.getElementById('touchDashBtn'),

  startOverlay: document.getElementById('startOverlay'),
  startHighScore: document.getElementById('startHighScore'),
  btnStartGame: document.getElementById('btnStartGame'),

  pauseOverlay: document.getElementById('pauseOverlay'),
  btnResume: document.getElementById('btnResume'),
  btnRestartFromPause: document.getElementById('btnRestartFromPause'),

  gameOverOverlay: document.getElementById('gameOverOverlay'),
  newRecordBadge: document.getElementById('newRecordBadge'),
  overScore: document.getElementById('overScore'),
  overDusk: document.getElementById('overDusk'),
  overMotes: document.getElementById('overMotes'),
  overHighScore: document.getElementById('overHighScore'),
  btnPlayAgain: document.getElementById('btnPlayAgain')
};

Lumen.HUD = {
  _bannerTimerId: null,

  renderLives() {
    const { hp, maxHp } = Lumen.State.player;
    const DOM = Lumen.DOM;
    DOM.lives.innerHTML = '';
    for (let i = 0; i < maxHp; i++) {
      const active = i < hp;
      const heart = document.createElement('div');
      heart.className = 'transition-transform duration-200 ' + (active ? 'scale-100' : 'scale-90 opacity-25');
      heart.innerHTML = `
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 20.5C12 20.5 3.5 14.8 3.5 8.6C3.5 5.8 5.7 3.7 8.3 3.7C9.9 3.7 11.3 4.5 12 5.7C12.7 4.5 14.1 3.7 15.7 3.7C18.3 3.7 20.5 5.8 20.5 8.6C20.5 14.8 12 20.5 12 20.5Z"
                fill="${active ? '#ffd24a' : '#37474f'}"
                stroke="${active ? '#fff9db' : '#546e7a'}"
                stroke-width="1.4"/>
          ${active ? '<circle cx="9.2" cy="7.8" r="1.4" fill="#ffffff" fill-opacity="0.85"/>' : ''}
        </svg>
      `;
      if (active) {
        heart.style.filter = 'drop-shadow(0 0 6px rgba(255, 210, 74, 0.85))';
      }
      DOM.lives.appendChild(heart);
    }
  },

  update() {
    const State = Lumen.State;
    const DOM = Lumen.DOM;
    const CONFIG = Lumen.CONFIG;
    const Utils = Lumen.Utils;
    const p = State.player;

    DOM.duskTitle.textContent = `DUSK ${Utils.toRoman(State.dusk)}`;
    DOM.duskSub.textContent = CONFIG.DUSK_REGIONS[(State.dusk - 1) % CONFIG.DUSK_REGIONS.length];

    const pct = State.boss ? 100 : Utils.clamp((State.duskProgress / State.duskGoal) * 100, 0, 100);
    DOM.progressFill.style.width = `${pct.toFixed(1)}%`;

    const tierInfo = CONFIG.WEAPON_TIERS[Utils.clamp(p.weaponTier, 0, CONFIG.WEAPON_TIERS.length - 1)];
    DOM.weaponTier.textContent = tierInfo.name;
    DOM.shieldBadge.classList.toggle('hidden', !p.shield);

    const dashReadyPct = Utils.clamp((1 - p.dashCd / p.dashMaxCd) * 100, 0, 100);
    DOM.dashFill.style.width = `${dashReadyPct.toFixed(0)}%`;

    DOM.score.textContent = Math.floor(State.score).toLocaleString();
    DOM.motes.textContent = State.motes.toLocaleString();

    if (State.combo > 1.05 && State.comboTimer > 0) {
      DOM.comboWrap.classList.remove('hidden');
      DOM.combo.textContent = `x${State.combo.toFixed(1)}`;
    } else {
      DOM.comboWrap.classList.add('hidden');
    }

    if (State.boss && !State.boss.dead) {
      const b = State.boss;
      const hpPct = Utils.clamp((b.hp / b.maxHp) * 100, 0, 100);
      DOM.bossBarFill.style.width = `${hpPct.toFixed(1)}%`;

      if (b.guardTimer > 0) {
        DOM.bossPhaseTag.textContent = 'WING GUARD • ARMORED';
        DOM.bossPhaseTag.style.borderColor = 'rgba(126, 249, 255, 0.7)';
        DOM.bossPhaseTag.style.color = '#7ef9ff';
      } else if (b.phase === 3) {
        DOM.bossPhaseTag.textContent = 'PHASE III • ECLIPSE FRENZY';
        DOM.bossPhaseTag.style.borderColor = 'rgba(255, 64, 129, 0.75)';
        DOM.bossPhaseTag.style.color = '#ff80ab';
      } else if (b.phase === 2) {
        DOM.bossPhaseTag.textContent = 'PHASE II • AWAKENING';
        DOM.bossPhaseTag.style.borderColor = 'rgba(213, 0, 249, 0.7)';
        DOM.bossPhaseTag.style.color = '#ea80fc';
      } else {
        DOM.bossPhaseTag.textContent = 'PHASE I • WALTZ';
        DOM.bossPhaseTag.style.borderColor = 'rgba(255, 79, 163, 0.45)';
        DOM.bossPhaseTag.style.color = '#ffd6ec';
      }
    }
  },

  showBanner(eyebrow, title, subtitle, duration = 1.8) {
    const DOM = Lumen.DOM;
    if (!DOM.bossBanner) return;
    DOM.bossBannerEyebrow.textContent = eyebrow;
    DOM.bossBannerTitle.textContent = title;
    DOM.bossBannerSub.textContent = subtitle;
    DOM.bossBanner.classList.remove('hidden');
    DOM.bossBanner.style.opacity = '1';
    DOM.bossBanner.style.visibility = 'visible';
    DOM.bossBanner.classList.add('show');
    Lumen.State.bossBannerTimer = duration;

    clearTimeout(this._bannerTimerId);
    this._bannerTimerId = setTimeout(() => {
      this.hideBanner();
    }, duration * 1000);
  },

  hideBanner() {
    const DOM = Lumen.DOM;
    if (!DOM.bossBanner) return;
    DOM.bossBanner.classList.remove('show');
    DOM.bossBanner.classList.add('hidden');
    DOM.bossBanner.style.opacity = '0';
    DOM.bossBanner.style.visibility = 'hidden';
    Lumen.State.bossBannerTimer = 0;
  },

  setOverlay(el, visible) {
    el.classList.toggle('hidden', !visible);
    el.classList.toggle('flex', visible);
  }
};