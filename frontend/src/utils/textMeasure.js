/**
 * textMeasure.js — Pretext Singleton Wrapper
 *
 * Uses @chenglou/pretext to measure text dimensions via the canvas API,
 * completely bypassing DOM layout reflows. All measurements are zero-DOM.
 *
 * RULES:
 *  - Call measureHeight / willExceedLines AFTER document.fonts.ready resolves.
 *  - Keep handles cached at the call site if measuring the same text multiple times.
 *  - LINE_HEIGHT_PX must stay in sync with the `line-height` in index.css for body text.
 */
import { prepare, layout } from '@chenglou/pretext';

// --- Design System Constants (must match index.css) ---
// Body text: 'Plus Jakarta Sans' at 1rem (16px), line-height: 1.6 → 25.6px
const FONT_SPEC_BODY = '16px "Plus Jakarta Sans", -apple-system, sans-serif';
const FONT_SPEC_SM   = '15px "Plus Jakarta Sans", -apple-system, sans-serif';
const LINE_HEIGHT_PX = 25.6; // 16px × 1.6

// --- Font readiness gate ---
let _fontReady = false;

// Async: resolves when all fonts are loaded by the browser
if (typeof document !== 'undefined') {
  document.fonts.ready.then(() => {
    _fontReady = true;
  });
}

/**
 * Returns the pixel height of a block of text rendered at a given width.
 * Returns null if fonts aren't loaded yet (safe to ignore; component falls back to CSS).
 *
 * @param {string} text       - The text string to measure.
 * @param {number} widthPx    - Container width in pixels (excluding padding).
 * @param {string} [fontSpec] - CSS font spec (defaults to body font).
 * @returns {number|null}     - Height in pixels, or null if not ready.
 */
export function measureHeight(text, widthPx, fontSpec = FONT_SPEC_BODY) {
  if (!_fontReady || !text || widthPx <= 0) return null;
  try {
    const handle = prepare(text, fontSpec);
    return layout(handle, widthPx, LINE_HEIGHT_PX).height;
  } catch {
    return null;
  }
}

/**
 * Returns the line count for a block of text.
 *
 * @param {string} text
 * @param {number} widthPx
 * @param {string} [fontSpec]
 * @returns {number} - Line count, or 0 if not ready.
 */
export function getLineCount(text, widthPx, fontSpec = FONT_SPEC_BODY) {
  if (!_fontReady || !text || widthPx <= 0) return 0;
  try {
    const handle = prepare(text, fontSpec);
    return layout(handle, widthPx, LINE_HEIGHT_PX).lineCount;
  } catch {
    return 0;
  }
}

/**
 * Returns true if the text would exceed maxLines when rendered at widthPx.
 * The primary driver for the "Read More" truncation pattern.
 *
 * @param {string} text
 * @param {number} widthPx
 * @param {number} maxLines
 * @param {string} [fontSpec]
 * @returns {boolean}
 */
export function willExceedLines(text, widthPx, maxLines, fontSpec = FONT_SPEC_BODY) {
  return getLineCount(text, widthPx, fontSpec) > maxLines;
}

/**
 * Small font variant — used for history card text (slightly smaller).
 */
export { FONT_SPEC_SM, LINE_HEIGHT_PX };
