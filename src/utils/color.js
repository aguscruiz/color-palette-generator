import { wcagContrast, converter, formatCss } from 'culori';

const toOklch = converter('oklch');

/**
 * Converts OKLCH values to a CSS string.
 * @param {number} l - Lightness (0-1)
 * @param {number} c - Chroma (0-0.4 is a good range)
 * @param {number} h - Hue (0-360)
 * @returns {string} CSS color string
 */
export const oklch = (l, c, h) => `oklch(${l} ${c} ${h})`;

/**
 * Finds the lightness value that achieves the target contrast against a reference.
 * @param {number} c - Chroma
 * @param {number} h - Hue
 * @param {number} targetContrast - Desired WCAG contrast ratio (e.g., 4.5)
 * @param {string} referenceColor - Color to contrast against (default white)
 * @returns {number|null} The lightness value (0-1) or null if not possible
 */
export const adjustLightnessForContrast = (c, h, targetContrast, referenceColor = '#ffffff') => {
  // Binary search for lightness
  let min = 0;
  let max = 1;
  let bestL = null;
  let minDiff = Infinity;

  for (let i = 0; i < 20; i++) {
    const mid = (min + max) / 2;
    const color = { mode: 'oklch', l: mid, c, h };
    const currentContrast = wcagContrast(color, referenceColor);
    
    const diff = Math.abs(currentContrast - targetContrast);
    if (diff < minDiff) {
      minDiff = diff;
      bestL = mid;
    }

    if (Math.abs(currentContrast - targetContrast) < 0.05) {
      return mid; 
    }

    // This logic assumes we are looking for a color DARKER than white.
    // As L decreases, contrast increases against white.
    // White is L=1. Black is L=0.
    // L=1 vs White -> Contrast 1:1
    // L=0 vs White -> Contrast 21:1
    // So lower L = higher contrast.
    
    if (currentContrast < targetContrast) {
      // Need more contrast -> Lower L -> Search in lower half
      max = mid;
    } else {
      // Too much contrast -> Higher L -> Search in upper half
      min = mid;
    }
  }
  
  return bestL;
};

/**
 * Generates a palette of steps based on a base color.
 * We vary lightness to create steps.
 * @param {string} id - Unique ID for the color family
 * @param {number} l - Base Lightness
 * @param {number} c - Base Chroma
 * @param {number} h - Base Hue
 * @param {number} steps - Number of steps to generate
 * @param {Object} contrastTargets - Map of step index to target contrast
 * @returns {Array} Array of color objects
 */

// Step names for the 18 default steps
const STEP_NAMES = ['100', '99', '98', '95', '90', '80', '70', '60', '50', '40', '35', '30', '25', '20', '15', '10', '5', '0'];

export const generatePalette = (id, l, c, h, steps = 18, contrastTargets = {}) => {
  const palette = [];
  // We want to span from high lightness to low lightness, or centered around the base L.
  // A common approach for a palette is to go from near white to near black.
  // Let's try to generate a range that includes the base color but spans the full lightness range.
  // Or, simpler: just generate a spread of lightnesses keeping C and H constant.

  for (let i = 0; i < steps; i++) {
    let currentL;
    let isContrastForced = false;

    if (contrastTargets[i]) {
      const target = contrastTargets[i];
      const adjustedL = adjustLightnessForContrast(c, h, target);
      if (adjustedL !== null) {
        currentL = adjustedL;
        isContrastForced = true;
      } else {
        // Fallback if impossible? Just use default for now.
        const t = i / (steps - 1);
        currentL = 0.97 - (t * 0.9);
      }
    } else {
      // Calculate lightness: distribute from 0.95 down to 0.10
      // i=0 -> 0.95 (lightest)
      // i=steps-1 -> 0.10 (darkest)
      const t = i / (steps - 1);
      currentL = 0.97 - (t * 0.9); // 0.97 down to 0.07
    }
    
    palette.push({
      id: `${id}-${i}`,
      stepName: STEP_NAMES[i] || `${i}`,
      l: parseFloat(currentL.toFixed(3)),
      c: c,
      h: h,
      css: oklch(currentL, c, h),
      contrastTarget: contrastTargets[i],
      isContrastForced
    });
  }
  return palette;
};

/**
 * Generates a random OKLCH color.
 */
export const randomColor = () => {
  const l = 0.6 + Math.random() * 0.2; // 0.6 - 0.8
  const c = 0.1 + Math.random() * 0.2; // 0.1 - 0.3
  const h = Math.floor(Math.random() * 360);
  return { l, c, h };
};

export const hexToOklch = (hex) => {
  const color = converter('oklch')(hex);
  if (!color) return null;
  return {
    l: color.l,
    c: color.c,
    h: color.h || 0 // Handle achromatic colors
  };
};

export const oklchToHex = (l, c, h) => {
  return formatCss({ mode: 'oklch', l, c, h, alpha: 1 });
};
