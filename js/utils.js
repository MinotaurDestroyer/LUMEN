/**
 * js/utils.js
 * Stateless math, geometry, color alpha conversion, and Roman numeral formatting utilities.
 */
window.Lumen = window.Lumen || {};

Lumen.Utils = {
  TAU: Math.PI * 2,
  rand: (min, max) => min + Math.random() * (max - min),
  randInt: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
  clamp: (v, min, max) => (v < min ? min : v > max ? max : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  distSq: (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  },

  hexWithAlpha(hex, alpha) {
    if (!hex || hex[0] !== '#') return `rgba(255, 79, 163, ${alpha})`;
    let h = hex.slice(1);
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const intVal = parseInt(h, 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  toRoman(num) {
    const numerals = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let n = Math.max(1, Math.floor(num));
    let out = '';
    for (const [val, sym] of numerals) {
      while (n >= val) {
        out += sym;
        n -= val;
      }
    }
    return out;
  }
};