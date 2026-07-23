/**
 * Pure renderer for shareable convergence cards.
 * Returns a self-contained SVG string (1200x630). Read-only presentation.
 * No em dashes, wonder register, no belief-assertion.
 */

export interface ConvergenceCardInput {
  symbolId: string;
  svgData?: string | null;
  vectorJson?: unknown | null;
  imageUrl?: string | null;
  seenItCount: number;
  upvotes: number;
  leadingTags: string[]; // up to 3
  submitter?: {
    handle?: string | null;
    avatarUrl?: string | null;
    avatarSeed?: string | null;
  } | null;
  generatedAt?: string; // ISO
}

const W = 1200;
const H = 630;
const PAPER = "#F0EADA"; // warm paper
const INK = "#141210"; // void
const MUTED = "#5C554A";
const HAIRLINE = "#C41E3A"; // 650nm accent - hairline only

const F_DISPLAY =
  "Fraunces, 'Fraunces Fallback', Georgia, 'Times New Roman', serif";
const F_BODY =
  "'Hanken Grotesk', 'Hanken Grotesk Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const F_MONO =
  "'IBM Plex Mono', 'IBM Plex Mono Fallback', 'SFMono-Regular', Menlo, Consolas, monospace";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripDashes(s: string): string {
  // Wonder register: no em dashes. Normalize any that slipped in.
  return s.replace(/[\u2014\u2013]/g, "-");
}

function extractInnerSvg(svgString: string): { inner: string; viewBox: string } | null {
  try {
    const openMatch = svgString.match(/<svg\b[^>]*>/i);
    const closeIdx = svgString.lastIndexOf("</svg>");
    if (!openMatch || closeIdx < 0) return null;
    const openTag = openMatch[0];
    const innerStart = openMatch.index! + openTag.length;
    const inner = svgString.slice(innerStart, closeIdx);
    const vbMatch = openTag.match(/viewBox\s*=\s*"([^"]+)"/i);
    let viewBox = vbMatch ? vbMatch[1] : "";
    if (!viewBox) {
      const wMatch = openTag.match(/\bwidth\s*=\s*"([\d.]+)/i);
      const hMatch = openTag.match(/\bheight\s*=\s*"([\d.]+)/i);
      const w = wMatch ? parseFloat(wMatch[1]) : 512;
      const h = hMatch ? parseFloat(hMatch[1]) : 512;
      viewBox = `0 0 ${w} ${h}`;
    }
    return { inner, viewBox };
  } catch {
    return null;
  }
}

function renderHero(input: ConvergenceCardInput): string {
  // Hero box: left half of card, centered square.
  const boxSize = 460;
  const boxX = 80;
  const boxY = (H - boxSize) / 2;

  const bg = `<rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="8" fill="#FFFFFF"/>`;

  if (input.svgData) {
    const parsed = extractInnerSvg(input.svgData);
    if (parsed) {
      return `${bg}<svg x="${boxX + 30}" y="${boxY + 30}" width="${boxSize - 60}" height="${boxSize - 60}" viewBox="${esc(parsed.viewBox)}" preserveAspectRatio="xMidYMid meet">${parsed.inner}</svg>`;
    }
  }

  if (input.imageUrl) {
    // Embed as <image>. Rasterizer (resvg) will fetch remote hrefs when configured.
    return `${bg}<image x="${boxX + 30}" y="${boxY + 30}" width="${boxSize - 60}" height="${boxSize - 60}" href="${esc(input.imageUrl)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // Fallback glyph: neutral concentric mark.
  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  return `${bg}<g stroke="${INK}" stroke-width="1.5" fill="none" opacity="0.6"><circle cx="${cx}" cy="${cy}" r="140"/><circle cx="${cx}" cy="${cy}" r="90"/><circle cx="${cx}" cy="${cy}" r="40"/></g>`;
}

function renderRight(input: ConvergenceCardInput): string {
  const x = 620;
  const topY = 120;
  const rightEdge = W - 80;
  const width = rightEdge - x;

  const seen = input.seenItCount;
  const convergenceLine =
    seen > 0
      ? `1 of ${seen.toLocaleString()} recognized this`
      : "be the first to recognize this";

  const kicker = stripDashes("A convergence card");
  const heading = stripDashes(convergenceLine);

  // Hairline 650nm accent
  const hairline = `<line x1="${x}" y1="${topY}" x2="${x + 48}" y2="${topY}" stroke="${HAIRLINE}" stroke-width="1"/>`;

  const kickerT = `<text x="${x}" y="${topY + 34}" font-family="${F_MONO}" font-size="14" fill="${MUTED}" letter-spacing="2">${esc(kicker.toUpperCase())}</text>`;

  // Heading may wrap to 2 lines. Simple greedy wrap.
  const words = heading.split(" ");
  const lines: string[] = [];
  let cur = "";
  const maxChars = 22; // rough for 64px display font
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length >= 1 && cur.length > maxChars) {
      lines.push(cur);
      cur = "";
      break;
    }
  }
  if (cur) lines.push(cur);
  const headText = lines
    .slice(0, 3)
    .map(
      (ln, i) =>
        `<text x="${x}" y="${topY + 100 + i * 72}" font-family="${F_DISPLAY}" font-size="64" font-weight="500" fill="${INK}">${esc(ln)}</text>`,
    )
    .join("");

  const sub = stripDashes(
    seen > 0
      ? "Strangers, independently, reporting the same visual form."
      : "Every recognition helps us map where these forms converge.",
  );
  const subT = `<text x="${x}" y="${topY + 100 + Math.min(lines.length, 3) * 72 + 24}" font-family="${F_BODY}" font-size="20" fill="${MUTED}">${esc(sub)}</text>`;

  return `${hairline}${kickerT}${headText}${subT}`;
}

function renderCluster(input: ConvergenceCardInput): string {
  // Bottom-right, super-subtle mono cluster.
  const x = W - 80;
  const y = H - 90;
  const handle = input.submitter?.handle ? `@${input.submitter.handle}` : "@anon";
  const tags = (input.leadingTags || []).slice(0, 3);
  const parts: string[] = [];
  parts.push(handle);
  if (tags.length) parts.push(tags.map((t) => `#${t}`).join(" "));
  parts.push(`seen ${input.seenItCount}`);
  parts.push(`up ${input.upvotes}`);
  const line = stripDashes(parts.join("  ·  "));
  return `<text x="${x}" y="${y}" font-family="${F_MONO}" font-size="14" fill="${MUTED}" text-anchor="end">${esc(line)}</text>`;
}

function renderFooter(input: ConvergenceCardInput): string {
  const shortId = input.symbolId.slice(0, 8);
  const y = H - 90;
  const brand = `<text x="80" y="${y}" font-family="${F_DISPLAY}" font-size="18" font-weight="500" fill="${INK}">dmtcode.com</text>`;
  const id = `<text x="80" y="${y + 26}" font-family="${F_MONO}" font-size="13" fill="${MUTED}">symbol / ${esc(shortId)}</text>`;
  return `${brand}${id}`;
}

export function renderConvergenceCard(input: ConvergenceCardInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const sourceUrl = `https://dmtcode.com/registry/${input.symbolId}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    identifier: input.symbolId,
    url: sourceUrl,
    dateCreated: generatedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: input.submitter?.handle
      ? { "@type": "Person", name: input.submitter.handle }
      : undefined,
    about: {
      "@type": "Thing",
      name: "DMT visual convergence",
    },
    additionalType: "https://dmtcode.com/schema/ConvergenceCard",
    "dmtcode:convergence": {
      symbol_id: input.symbolId,
      seen_it_count: input.seenItCount,
      upvotes: input.upvotes,
      leading_tags: input.leadingTags || [],
      generated_at: generatedAt,
      source_url: sourceUrl,
    },
  };

  const dataAttrs = [
    `data-symbol-id="${esc(input.symbolId)}"`,
    `data-seen-it-count="${input.seenItCount}"`,
    `data-upvotes="${input.upvotes}"`,
    `data-leading-tags="${esc((input.leadingTags || []).join(","))}"`,
    `data-generated-at="${esc(generatedAt)}"`,
    `data-source-url="${esc(sourceUrl)}"`,
  ].join(" ");

  const bg = `<rect width="${W}" height="${H}" fill="${PAPER}"/>`;
  // Subtle grain via a very light pattern of dots
  const grain = `<g opacity="0.06" fill="${INK}">${
    Array.from({ length: 60 })
      .map(() => {
        const x = Math.floor(Math.random() * W);
        const y = Math.floor(Math.random() * H);
        return `<circle cx="${x}" cy="${y}" r="0.6"/>`;
      })
      .join("")
  }</g>`;

  // Divider hairline between hero and text
  const divider = `<line x1="600" y1="120" x2="600" y2="${H - 120}" stroke="${INK}" stroke-opacity="0.08" stroke-width="1"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ${dataAttrs}>
  <metadata>
    <script type="application/ld+json" xmlns=""><![CDATA[${JSON.stringify(jsonLd).replace(/]]>/g, "]]]]><![CDATA[>")}]]></script>
  </metadata>
  <title>Convergence card for symbol ${esc(input.symbolId.slice(0, 8))}</title>
  <desc>${esc(
    stripDashes(
      input.seenItCount > 0
        ? `1 of ${input.seenItCount} recognized this symbol.`
        : "Be the first to recognize this symbol.",
    ),
  )}</desc>
  ${bg}
  ${grain}
  ${divider}
  ${renderHero(input)}
  ${renderRight(input)}
  ${renderCluster(input)}
  ${renderFooter(input)}
</svg>`;
}
