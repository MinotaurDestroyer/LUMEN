/**
 * js/treasure.js
 * Manages boss treasure drops, auto-sorted inventory storage, custom SVG treasure
 * images, chest reveal modals, auto-pausing gameplay on open, and the 6-box
 * drag-and-drop / click-to-place arrangement puzzle.
 */
window.Lumen = window.Lumen || {};

(function () {
  const toSvgUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const CHEST_CLOSED_IMG = toSvgUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffd24a" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#ffd24a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="44" fill="url(#g)"/>
      <rect x="18" y="34" width="60" height="40" rx="9" fill="#132e3c" stroke="#ffd24a" stroke-width="3.5"/>
      <path d="M18 45h60" stroke="#ffd24a" stroke-width="3.5"/>
      <path d="M26 34v40M70 34v40" stroke="#f59e0b" stroke-width="2.5"/>
      <rect x="41" y="39" width="14" height="15" rx="3" fill="#06151e" stroke="#7ef9ff" stroke-width="2.5"/>
      <circle cx="48" cy="46" r="2.6" fill="#7ef9ff"/>
    </svg>
  `);

  const RELIC_IMAGES = [
    // 1. Crescent Wing Crest (Luna Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#98f5b8" fill-opacity="0.16"/>
        <path d="M48 16 C26 24, 16 44, 24 64 C30 78, 42 82, 48 84 C54 82, 66 78, 72 64 C80 44, 70 24, 48 16 Z" fill="#133b32" stroke="#98f5b8" stroke-width="3.5"/>
        <path d="M48 24 C34 32, 30 50, 40 66 C34 54, 38 38, 48 32 C58 38, 62 54, 56 66 C66 50, 62 32, 48 24 Z" fill="#98f5b8"/>
        <circle cx="48" cy="52" r="7" fill="#fff3b0" stroke="#4db678" stroke-width="2.5"/>
      </svg>
    `),
    // 2. Titan Ember Prism (Atlas Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#d95f26" fill-opacity="0.18"/>
        <polygon points="48,14 78,48 48,82 18,48" fill="#4a1d12" stroke="#f2b880" stroke-width="3.5"/>
        <polygon points="48,24 68,48 48,72 28,48" fill="#d95f26"/>
        <polygon points="48,34 58,48 48,62 38,48" fill="#fff5e4"/>
      </svg>
    `),
    // 3. Dawn Rosette (Rosy Maple Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#ff7eb6" fill-opacity="0.18"/>
        <circle cx="48" cy="48" r="28" fill="#ff7eb6" stroke="#ffe66d" stroke-width="3.5"/>
        <polygon points="48,16 56,38 78,38 60,52 67,74 48,60 29,74 36,52 18,38 40,38" fill="#ffe66d"/>
        <circle cx="48" cy="48" r="8" fill="#fff3b0"/>
      </svg>
    `),
    // 4. Memento Skull Sigil (Death's-Head Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#ffc93c" fill-opacity="0.16"/>
        <circle cx="48" cy="48" r="32" fill="#2b1e19" stroke="#ffc93c" stroke-width="3.5"/>
        <circle cx="48" cy="43" r="14" fill="#f8f9fa"/>
        <rect x="41" y="53" width="14" height="10" rx="3" fill="#f8f9fa"/>
        <circle cx="43" cy="42" r="3.2" fill="#1b1b22"/>
        <circle cx="53" cy="42" r="3.2" fill="#1b1b22"/>
        <path d="M45 56v6M48 56v6M51 56v6" stroke="#1b1b22" stroke-width="2"/>
      </svg>
    `),
    // 5. Cinder Fang Core (Tiger Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#ff7315" fill-opacity="0.18"/>
        <polygon points="48,14 74,34 66,76 30,76 22,34" fill="#1b1b22" stroke="#ff7315" stroke-width="3.5"/>
        <path d="M32 38l16 14 16-14M30 54l18 14 18-14" fill="none" stroke="#ff7315" stroke-width="4" stroke-linecap="round"/>
        <circle cx="48" cy="30" r="6" fill="#ffd166"/>
      </svg>
    `),
    // 6. Crown of Dawn (Cecropia Moth)
    toSvgUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#64dfdf" fill-opacity="0.18"/>
        <path d="M20 64 L26 30 L40 46 L48 22 L56 46 L70 30 L76 64 Z" fill="#9e473b" stroke="#64dfdf" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="20" y="64" width="56" height="10" rx="4" fill="#64dfdf"/>
        <circle cx="48" cy="52" r="6" fill="#ff4d6d" stroke="#fff5bd" stroke-width="2"/>
      </svg>
    `)
  ];

  Lumen.TreasureSystem = {
    CHEST_CLOSED_IMG,
    RELICS: [
      {
        slotIndex: 0,
        dusk: 1,
        bossName: 'Luna Moth',
        chestName: 'Luna Casket',
        relicName: 'Crescent Wing Crest',
        clue: 'Dusk I • Pale Emerald Moth',
        lore: 'A pale emerald emblem shed by the Luna Moth.',
        imageUrl: RELIC_IMAGES[0]
      },
      {
        slotIndex: 1,
        dusk: 2,
        bossName: 'Atlas Moth',
        chestName: 'Atlas Reliquary',
        relicName: 'Titan Ember Prism',
        clue: 'Dusk II • Crimson Canopy Titan',
        lore: 'Warm crimson amber pulled from the Atlas Moth’s wings.',
        imageUrl: RELIC_IMAGES[1]
      },
      {
        slotIndex: 2,
        dusk: 3,
        bossName: 'Rosy Maple Moth',
        chestName: 'Petal Coffer',
        relicName: 'Dawn Rosette',
        clue: 'Dusk III • Pink & Gold Weaver',
        lore: 'Crystallized rose-and-gold pollen from the Rosy Maple Moth.',
        imageUrl: RELIC_IMAGES[2]
      },
      {
        slotIndex: 3,
        dusk: 4,
        bossName: "Death's-Head Moth",
        chestName: 'Hollow Urn',
        relicName: 'Memento Skull Sigil',
        clue: 'Dusk IV • Hollow Night Harbinger',
        lore: 'An ancient nocturnal skull seal guarded by the Death’s-Head Moth.',
        imageUrl: RELIC_IMAGES[3]
      },
      {
        slotIndex: 4,
        dusk: 5,
        bossName: 'Tiger Moth',
        chestName: 'Striped Ark',
        relicName: 'Cinder Fang Core',
        clue: 'Dusk V • Striped Briar Ember',
        lore: 'Crackles with the fierce orange spark of the Tiger Moth.',
        imageUrl: RELIC_IMAGES[4]
      },
      {
        slotIndex: 5,
        dusk: 6,
        bossName: 'Cecropia Moth',
        chestName: 'Biolume Vault',
        relicName: 'Crown of Dawn',
        clue: 'Dusk VI • Bioluminescent Sovereign',
        lore: 'The final cyan-rimmed keystone of the Cecropia Moth.',
        imageUrl: RELIC_IMAGES[5]
      }
    ],

    _toastTimer: null,

    reset() {
      const { State } = Lumen;
      State.treasureDrops = [];
      State.inventory = [];
      State.puzzleSlots = [null, null, null, null, null, null];
      State.selectedRelicId = null;
      State.activeOpenedTreasure = null;
      State.puzzleSolved = false;
      State.newPuzzleAlert = false;
      State.pausedFromOverlay = false;
      this.refreshBadges();
    },

    spawnDrop(x, y, defeatedDusk) {
      const { State } = Lumen;
      const preferredIdx = (defeatedDusk - 1) % this.RELICS.length;
      let template = this.RELICS[preferredIdx];

      const isOwned = (idx) =>
        State.inventory.some((item) => item.slotIndex === idx) ||
        State.treasureDrops.some((drop) => drop.slotIndex === idx);

      if (isOwned(preferredIdx)) {
        const nextMissing = this.RELICS.find((r) => !isOwned(r.slotIndex));
        if (!nextMissing) return;
        template = nextMissing;
      }

      State.treasureDrops.push({
        ...template,
        x,
        y,
        r: 22,
        phase: 0
      });
    },

    updateDrops(dt) {
      const { State, Utils, VFX, sfx } = Lumen;
      const p = State.player;
      if (!p || !State.treasureDrops) return;

      for (let i = State.treasureDrops.length - 1; i >= 0; i--) {
        const drop = State.treasureDrops[i];
        drop.phase += dt * 4.2;

        const d = Utils.dist(drop.x, drop.y, p.x, p.y);
        if (d < 210 && d > 1) {
          const ang = Math.atan2(p.y - drop.y, p.x - drop.x);
          const pullSpd = Utils.lerp(310, 95, d / 210);
          drop.x += Math.cos(ang) * pullSpd * dt;
          drop.y += Math.sin(ang) * pullSpd * dt;
        }

        if (d < drop.r + 20) {
          this.collectDrop(i);
          VFX.ring(drop.x, drop.y, 12, 130, 0.55, '#ffd24a', 3.5);
          VFX.burst(drop.x, drop.y, '#ffd24a', 22, 200, 5, 0.7);
          VFX.callout(drop.x, drop.y - 24, `${drop.chestName.toUpperCase()} COLLECTED`, '#ffd24a');
          if (sfx && typeof sfx.powerup === 'function') sfx.powerup();
        }
      }
    },

    collectDrop(dropIndex) {
      const { State } = Lumen;
      const [drop] = State.treasureDrops.splice(dropIndex, 1);
      if (!drop) return;

      State.inventory.push({
        slotIndex: drop.slotIndex,
        dusk: drop.dusk,
        bossName: drop.bossName,
        chestName: drop.chestName,
        relicName: drop.relicName,
        clue: drop.clue,
        lore: drop.lore,
        imageUrl: drop.imageUrl,
        status: 'unopened' // 'unopened' -> 'unplaced' -> 'placed'
      });

      this.sortInventory();
      this.refreshBadges();
      this.showToast(`"${drop.chestName}" stored & auto-sorted in Inventory!`);
    },

    sortInventory() {
      const { State } = Lumen;
      const rank = { unopened: 0, unplaced: 1, placed: 2 };
      State.inventory.sort((a, b) => {
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        return a.dusk - b.dusk;
      });
    },

    openTreasure(slotIndex) {
      const { State } = Lumen;
      const item = State.inventory.find((entry) => entry.slotIndex === slotIndex);
      if (!item) return;

      State.activeOpenedTreasure = item;

      const modal = document.getElementById('chestRevealModal');
      document.getElementById('revealTag').textContent =
        item.status === 'unopened' ? 'TREASURE OPENED' : 'TREASURE INSPECTED';
      document.getElementById('revealRelicImg').src = item.imageUrl;
      document.getElementById('revealRelicName').textContent = item.relicName;
      document.getElementById('revealRelicSource').textContent =
        `${item.chestName} • Dusk ${Lumen.Utils.toRoman(item.dusk)} (${item.bossName})`;
      document.getElementById('revealRelicLore').textContent = item.lore;
      document.getElementById('btnCloseChestReveal').textContent =
        item.status === 'unopened' ? 'CLOSE & SEND TO PUZZLE TRAY' : 'CLOSE';

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    },

    // Closing an opened treasure moves it into the Puzzle Tray (NOT auto-filled into the 6 boxes)
    closeOpenedTreasure() {
      const { State } = Lumen;
      const item = State.activeOpenedTreasure;
      const modal = document.getElementById('chestRevealModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');

      if (!item) return;

      if (item.status === 'unopened') {
        item.status = 'unplaced';
        State.newPuzzleAlert = true;
        this.sortInventory();
        this.refreshBadges();
        this.renderInventoryGrid();
        this.showToast(`"${item.relicName}" sent to the Puzzle Tray — arrange it into its box!`);
      }

      State.activeOpenedTreasure = null;
    },

    // Place or swap a treasure image into one of the 6 Puzzle Boxes
    placeRelicInBox(boxIndex) {
      const { State, VFX, HUD, sfx } = Lumen;
      if (State.puzzleSolved) return;

      const existingInBox = State.puzzleSlots[boxIndex];
      const selectedId = State.selectedRelicId;

      if (selectedId === null) {
        if (existingInBox) {
          State.selectedRelicId = existingInBox.slotIndex;
          this.renderPuzzleModal();
        }
        return;
      }

      if (existingInBox && existingInBox.slotIndex === selectedId) {
        existingInBox.status = 'unplaced';
        State.puzzleSlots[boxIndex] = null;
        State.selectedRelicId = null;
        this.sortInventory();
        this.refreshBadges();
        this.renderPuzzleModal();
        return;
      }

      const movingRelic = State.inventory.find((i) => i.slotIndex === selectedId);
      if (!movingRelic) {
        State.selectedRelicId = null;
        return;
      }

      const prevBoxIndex = State.puzzleSlots.findIndex(
        (s) => s && s.slotIndex === movingRelic.slotIndex
      );

      if (prevBoxIndex !== -1) {
        State.puzzleSlots[prevBoxIndex] = existingInBox || null;
        if (existingInBox) existingInBox.status = 'placed';
      } else if (existingInBox) {
        existingInBox.status = 'unplaced';
      }

      movingRelic.status = 'placed';
      State.puzzleSlots[boxIndex] = movingRelic;
      State.selectedRelicId = null;

      this.sortInventory();
      this.refreshBadges();
      this.renderPuzzleModal();

      const allFilled = State.puzzleSlots.every((slot) => slot !== null);
      const allCorrect = State.puzzleSlots.every(
        (slot, idx) => slot && slot.slotIndex === idx
      );

      if (allFilled && allCorrect) {
        State.puzzleSolved = true;
        State.score += 10000;
        State.player.hp = State.player.maxHp;
        State.player.shield = true;
        State.player.weaponTier = Math.min(
          Lumen.CONFIG.WEAPON_TIERS.length - 1,
          State.player.weaponTier + 1
        );
        HUD.renderLives();
        HUD.update();
        VFX.flash(0.75, '#ffd24a');
        if (sfx && typeof sfx.powerup === 'function') sfx.powerup();
        this.renderPuzzleModal();
        this.showToast('PUZZLE SOLVED! +10,000 Score & Full Lumen Overdrive!');
      }
    },

    returnAllToTray() {
      const { State } = Lumen;
      if (State.puzzleSolved) return;
      for (let i = 0; i < 6; i++) {
        if (State.puzzleSlots[i]) {
          State.puzzleSlots[i].status = 'unplaced';
          State.puzzleSlots[i] = null;
        }
      }
      State.selectedRelicId = null;
      this.sortInventory();
      this.refreshBadges();
      this.renderPuzzleModal();
    },

    isAnyModalOpen() {
      const invOpen = !document.getElementById('inventoryModal')?.classList.contains('hidden');
      const puzOpen = !document.getElementById('puzzleModal')?.classList.contains('hidden');
      const revOpen = !document.getElementById('chestRevealModal')?.classList.contains('hidden');
      return invOpen || puzOpen || revOpen;
    },

    _pauseForModal() {
      const { State, InputController } = Lumen;
      if (InputController && InputController.state) {
        InputController.state.mouseDown = false;
      }
      if (State.mode === 'playing') {
        State.mode = 'paused';
        State.pausedFromOverlay = true;
      }
    },

    _resumeFromModal() {
      const { State } = Lumen;
      if (State.pausedFromOverlay && State.mode === 'paused') {
        State.mode = 'playing';
        State.pausedFromOverlay = false;
      }
    },

    openInventory() {
      this._pauseForModal();
      this.sortInventory();
      this.renderInventoryGrid();
      const modal = document.getElementById('inventoryModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    },

    closeInventory() {
      if (Lumen.State.activeOpenedTreasure) {
        this.closeOpenedTreasure();
      }
      const modal = document.getElementById('inventoryModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      if (!this.isAnyModalOpen()) this._resumeFromModal();
    },

    openPuzzle() {
      this._pauseForModal();
      Lumen.State.newPuzzleAlert = false;
      this.refreshBadges();
      this.renderPuzzleModal();
      const modal = document.getElementById('puzzleModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    },

    closePuzzle() {
      Lumen.State.selectedRelicId = null;
      const modal = document.getElementById('puzzleModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      if (!this.isAnyModalOpen()) this._resumeFromModal();
    },

    refreshBadges() {
      const { State } = Lumen;
      const invBadge = document.getElementById('badgeInventory');
      const puzBadge = document.getElementById('badgePuzzle');
      if (!invBadge || !puzBadge) return;

      const unopenedCount = State.inventory.filter((i) => i.status === 'unopened').length;
      invBadge.textContent = unopenedCount;
      invBadge.classList.toggle('hidden', unopenedCount === 0);

      const unplacedCount = State.inventory.filter((i) => i.status === 'unplaced').length;
      const placedCount = State.puzzleSlots.filter(Boolean).length;
      puzBadge.textContent = unplacedCount > 0 ? `${unplacedCount}` : `${placedCount}/6`;
      puzBadge.classList.toggle('hidden', unplacedCount === 0 && placedCount === 0);
    },

    showToast(text) {
      const el = document.getElementById('treasureToast');
      if (!el) return;
      el.textContent = text;
      el.classList.remove('hidden');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
    },

    renderInventoryGrid() {
      const { State, Utils } = Lumen;
      const grid = document.getElementById('inventoryGrid');
      if (!grid) return;
      grid.innerHTML = '';

      if (State.inventory.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-8 text-center text-xs tracking-[0.16em] uppercase text-[#7ef9ff]/60">
            Defeat a Dusk Moth Boss to collect its treasure chest.
          </div>`;
        return;
      }

      State.inventory.forEach((item) => {
        const isUnopened = item.status === 'unopened';
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `inv-slot-card ${isUnopened ? 'is-unopened' : 'is-transferred'}`;
        card.innerHTML = `
          <div class="text-[9px] font-bold tracking-[0.18em] uppercase ${isUnopened ? 'text-[#ffd24a]' : 'text-[#7ef9ff]/70'}">
            DUSK ${Utils.toRoman(item.dusk)}
          </div>
          <img src="${isUnopened ? CHEST_CLOSED_IMG : item.imageUrl}" alt="${isUnopened ? item.chestName : item.relicName}"
               class="my-2 w-14 h-14 object-contain drop-shadow-[0_0_8px_rgba(255,210,74,0.45)]" />
          <div class="font-cinzel text-xs font-bold tracking-wider text-[#fff8dc]">
            ${isUnopened ? item.chestName : item.relicName}
          </div>
          <div class="mt-1.5 text-[9px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${
            isUnopened
              ? 'bg-[#ffd24a]/20 text-[#ffd24a] border border-[#ffd24a]/55'
              : 'bg-[#7ef9ff]/10 text-[#7ef9ff]/85 border border-[#7ef9ff]/30'
          }">
            ${isUnopened ? 'CLICK TO OPEN' : item.status === 'placed' ? 'IN PUZZLE BOX' : 'IN PUZZLE TRAY'}
          </div>
        `;
        card.addEventListener('click', () => this.openTreasure(item.slotIndex));
        grid.appendChild(card);
      });
    },

    renderPuzzleModal() {
      const { State, Utils } = Lumen;
      const grid = document.getElementById('puzzleGrid');
      const tray = document.getElementById('puzzleTray');
      const countLabel = document.getElementById('puzzleCountLabel');
      const statusBanner = document.getElementById('puzzleStatusBanner');
      if (!grid || !tray) return;

      const placedCount = State.puzzleSlots.filter(Boolean).length;
      const correctCount = State.puzzleSlots.filter((s, idx) => s && s.slotIndex === idx).length;
      if (countLabel) {
        countLabel.textContent = `${placedCount} / 6 BOXES FILLED • ${correctCount} / 6 IN RIGHT PLACE`;
      }

      if (statusBanner) {
        if (State.puzzleSolved) {
          statusBanner.textContent = 'CELESTIAL SEAL COMPLETE — ALL 6 TREASURES ARRANGED IN ORDER!';
          statusBanner.className = 'text-xs font-bold tracking-[0.16em] uppercase text-[#69f0ae] glow-gold mt-3 mb-3';
        } else if (placedCount === 6 && correctCount < 6) {
          statusBanner.textContent = 'All 6 boxes are filled, but some treasures are in the wrong box! Click or drag to swap them.';
          statusBanner.className = 'text-xs font-semibold tracking-[0.08em] text-[#ff80bf] mt-3 mb-3';
        } else {
          statusBanner.textContent = 'Drag a treasure image (or click to select, then click a box) to arrange all 6 treasures into their matching Dusk Box.';
          statusBanner.className = 'text-xs tracking-[0.08em] text-[#cfe8ee]/85 mt-3 mb-3';
        }
      }

      grid.innerHTML = '';
      this.RELICS.forEach((template, idx) => {
        const placed = State.puzzleSlots[idx];
        const isSelected = placed && State.selectedRelicId === placed.slotIndex;
        const isCorrect = State.puzzleSolved && placed && placed.slotIndex === idx;

        const box = document.createElement('div');
        box.className = `puzzle-box-slot ${placed ? 'is-occupied' : ''} ${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''}`;

        if (!placed) {
          box.innerHTML = `
            <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-[#ffd24a]">
              BOX ${Utils.toRoman(template.dusk)}
            </span>
            <div class="my-1.5 w-12 h-12 rounded-xl border border-dashed border-[#7ef9ff]/30 flex items-center justify-center text-base text-[#7ef9ff]/35">
              +
            </div>
            <span class="text-[9px] leading-tight text-[#cfe8ee]/70 px-1">
              ${template.clue}
            </span>
          `;
        } else {
          box.draggable = !State.puzzleSolved;
          box.innerHTML = `
            <div class="w-full flex items-center justify-between px-1">
              <span class="text-[9px] font-bold tracking-[0.18em] uppercase text-[#ffd24a]">
                BOX ${Utils.toRoman(template.dusk)}
              </span>
              <span class="text-[9px] text-[#7ef9ff]/75">
                ${isSelected ? 'SELECTED' : 'SWAP / REMOVE'}
              </span>
            </div>
            <img src="${placed.imageUrl}" alt="${placed.relicName}"
                 class="my-1 w-14 h-14 object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(126,249,255,0.4)]" />
            <span class="font-cinzel text-[11px] font-bold tracking-wider text-[#fff8dc]">
              ${placed.relicName}
            </span>
          `;
          box.addEventListener('dragstart', () => {
            State.selectedRelicId = placed.slotIndex;
          });
        }

        box.addEventListener('dragover', (e) => {
          e.preventDefault();
          box.classList.add('is-selected');
        });
        box.addEventListener('dragleave', () => {
          if (!isSelected) box.classList.remove('is-selected');
        });
        box.addEventListener('drop', (e) => {
          e.preventDefault();
          this.placeRelicInBox(idx);
        });
        box.addEventListener('click', () => this.placeRelicInBox(idx));

        grid.appendChild(box);
      });

      tray.innerHTML = '';
      const unplacedItems = State.inventory
        .filter((i) => i.status === 'unplaced')
        .slice()
        .sort((a, b) => b.dusk - a.dusk);

      if (unplacedItems.length === 0) {
        tray.innerHTML = `
          <span class="text-[11px] tracking-[0.14em] uppercase text-[#7ef9ff]/50">
            ${placedCount === 6 ? 'All 6 treasures placed in boxes!' : 'Open boss chests in your Inventory to add treasures here.'}
          </span>`;
        return;
      }

      unplacedItems.forEach((item) => {
        const isSelected = State.selectedRelicId === item.slotIndex;
        const card = document.createElement('div');
        card.draggable = true;
        card.className = `tray-relic-card ${isSelected ? 'is-selected' : ''}`;
        card.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.relicName}" class="w-12 h-12 object-contain pointer-events-none" />
          <span class="mt-1 font-cinzel text-[10px] font-bold text-[#fff8dc] text-center leading-tight">
            ${item.relicName}
          </span>
        `;
        card.addEventListener('dragstart', () => {
          State.selectedRelicId = item.slotIndex;
        });
        card.addEventListener('click', () => {
          State.selectedRelicId = isSelected ? null : item.slotIndex;
          this.renderPuzzleModal();
        });
        tray.appendChild(card);
      });
    },

    bindUI() {
      document.getElementById('btnInventory')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isAnyModalOpen()) this.closePuzzle();
        this.openInventory();
      });
      document.getElementById('btnCloseInventory')?.addEventListener('click', () => this.closeInventory());

      document.getElementById('btnPuzzle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isAnyModalOpen()) this.closeInventory();
        this.openPuzzle();
      });
      document.getElementById('btnClosePuzzle')?.addEventListener('click', () => this.closePuzzle());
      document.getElementById('btnClearPuzzleBoxes')?.addEventListener('click', () => this.returnAllToTray());

      document.getElementById('btnCloseChestReveal')?.addEventListener('click', () => this.closeOpenedTreasure());
      document.getElementById('btnXChestReveal')?.addEventListener('click', () => this.closeOpenedTreasure());

      window.addEventListener('keydown', (e) => {
        if (Lumen.State.mode === 'start' || Lumen.State.mode === 'gameover') return;
        if (e.code === 'KeyI') {
          const invOpen = !document.getElementById('inventoryModal').classList.contains('hidden');
          if (invOpen) this.closeInventory();
          else {
            this.closePuzzle();
            this.openInventory();
          }
        } else if (e.code === 'KeyO') {
          const puzOpen = !document.getElementById('puzzleModal').classList.contains('hidden');
          if (puzOpen) this.closePuzzle();
          else {
            this.closeInventory();
            this.openPuzzle();
          }
        } else if (e.code === 'Escape') {
          if (Lumen.State.activeOpenedTreasure) {
            this.closeOpenedTreasure();
          } else if (!document.getElementById('inventoryModal').classList.contains('hidden')) {
            this.closeInventory();
          } else if (!document.getElementById('puzzleModal').classList.contains('hidden')) {
            this.closePuzzle();
          }
        }
      });
    }
  };
})();