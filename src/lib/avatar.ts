// Deterministic glyph avatar generation from a seed string.
// No PII leaves the client. The seed is stored on the profile.

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let s = hashSeed(seed);
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * Render a small deterministic SVG glyph based on a seed.
 * Symmetric on the vertical axis so it reads as a mark, not noise.
 */
export function glyphSvg(seed: string, size = 64): string {
  const r = rng(seed || 'x');
  const grid = 5;
  const cells: boolean[][] = [];
  for (let y = 0; y < grid; y++) {
    cells[y] = [];
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      cells[y][x] = r() > 0.45;
    }
  }
  const cell = size / (grid + 2);
  const offset = cell;
  let rects = '';
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const mirror = x < Math.ceil(grid / 2) ? x : grid - 1 - x;
      if (cells[y][mirror]) {
        rects += `<rect x="${offset + x * cell}" y="${offset + y * cell}" width="${cell}" height="${cell}" rx="0.5"/>`;
      }
    }
  }
  const hue = Math.floor(r() * 360);
  const bg = `hsl(${hue} 22% 96%)`;
  const fg = `hsl(${hue} 55% 32%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><g fill="${fg}">${rects}</g></svg>`;
}

export function glyphDataUri(seed: string, size = 64): string {
  const svg = glyphSvg(seed, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
