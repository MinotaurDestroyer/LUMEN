/**
 * js/input.js
 * Handles keyboard shortcuts, mouse aiming/clicking, mobile virtual joystick
 * touch events, and HUD button bindings.
 */
window.Lumen = window.Lumen || {};

Lumen.InputController = {
  state: {
    keys: {},
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    mouseDown: false,
    touchActive: false,
    touchId: null,
    stickX: 0,
    stickY: 0
  },

  getMoveVector() {
    let x = 0;
    let y = 0;
    const k = this.state.keys;
    if (k['KeyW'] || k['ArrowUp']) y -= 1;
    if (k['KeyS'] || k['ArrowDown']) y += 1;
    if (k['KeyA'] || k['ArrowLeft']) x -= 1;
    if (k['KeyD'] || k['ArrowRight']) x += 1;

    if (this.state.touchActive) {
      x = this.state.stickX;
      y = this.state.stickY;
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y, len };
  },

  updateTouchStick(clientX, clientY) {
    const DOM = Lumen.DOM;
    const rect = DOM.touchStickZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    this.state.stickX = dx / maxR;
    this.state.stickY = dy / maxR;
    DOM.touchStickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  },

  bindEvents() {
    const { State, DOM, PlayerController, Game, sfx } = Lumen;

    window.addEventListener('keydown', (e) => {
      this.state.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (State.mode === 'playing') {
          e.preventDefault();
          PlayerController.triggerDash();
        }
      } else if (e.code === 'KeyE') {
        Game.toggleAutoFire();
      } else if (e.code === 'KeyM') {
        Game.toggleMute();
      } else if (e.code === 'KeyP') {
        if ((State.mode === 'playing' || State.mode === 'paused') && !Lumen.TreasureSystem?.isAnyModalOpen()) {
          Game.togglePause();
        }
      } else if (e.code === 'Escape') {
        if (Lumen.TreasureSystem?.isAnyModalOpen()) return;
        if (State.mode === 'playing' || State.mode === 'paused') {
          Game.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.state.keys[e.code] = false;
    });

    DOM.canvas.addEventListener('mousemove', (e) => {
      this.state.mouseX = e.clientX;
      this.state.mouseY = e.clientY;
    });

    DOM.canvas.addEventListener('mousedown', (e) => {
      sfx.unlock();
      if (e.button === 0) this.state.mouseDown = true;
      else if (e.button === 2) PlayerController.triggerDash();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.state.mouseDown = false;
    });

    DOM.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      DOM.touchControls.classList.remove('hidden');
    }

    DOM.touchStickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sfx.unlock();
      const t = e.changedTouches[0];
      this.state.touchActive = true;
      this.state.touchId = t.identifier;
      this.updateTouchStick(t.clientX, t.clientY);
    }, { passive: false });

    DOM.touchStickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.state.touchId) {
          this.updateTouchStick(t.clientX, t.clientY);
        }
      }
    }, { passive: false });

    const resetStick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.state.touchId) {
          this.state.touchActive = false;
          this.state.touchId = null;
          this.state.stickX = 0;
          this.state.stickY = 0;
          DOM.touchStickKnob.style.transform = 'translate(0px, 0px)';
        }
      }
    };

    DOM.touchStickZone.addEventListener('touchend', resetStick);
    DOM.touchStickZone.addEventListener('touchcancel', resetStick);

    DOM.touchDashBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sfx.unlock();
      PlayerController.triggerDash();
    }, { passive: false });

    DOM.btnStartGame.addEventListener('click', () => Game.start());
    DOM.btnPlayAgain.addEventListener('click', () => Game.start());
    DOM.btnAutoFire.addEventListener('click', () => Game.toggleAutoFire());
    DOM.btnMute.addEventListener('click', () => Game.toggleMute());
    DOM.btnPause.addEventListener('click', () => Game.togglePause());
    DOM.btnResume.addEventListener('click', () => Game.togglePause());
    DOM.btnRestartFromPause.addEventListener('click', () => Game.start());
  }
};