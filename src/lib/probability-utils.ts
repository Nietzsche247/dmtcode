/**
 * Probability display utilities for forecasts
 * Implements clamping and formatting rules
 */

// Maximum displayable probability (no event shows 100%)
const MAX_DISPLAY_PROBABILITY = 0.95;

/**
 * Clamp probability to max 95% for display
 * Events showing 100% display as "~95%" with tooltip explanation
 */
export function clampProbability(probability: number): {
  value: number;
  display: string;
  isClamped: boolean;
  tooltip: string | null;
} {
  const rawValue = probability > 1 ? probability / 100 : probability;
  
  if (rawValue >= MAX_DISPLAY_PROBABILITY) {
    return {
      value: MAX_DISPLAY_PROBABILITY,
      display: '~95%',
      isClamped: true,
      tooltip: 'No unprecedented event receives 100% probability.'
    };
  }
  
  return {
    value: rawValue,
    display: `${Math.round(rawValue * 100)}%`,
    isClamped: false,
    tooltip: null
  };
}

/**
 * Format probability for display with optional clamping indicator
 */
export function formatProbability(probability: number, showTilde = true): string {
  const { display, isClamped } = clampProbability(probability);
  if (isClamped && !showTilde) {
    return '95%';
  }
  return display;
}

/**
 * Parse conditional probability from dependency notes
 * Looks for patterns like "95% conditional", "P=0.85", "85% probability"
 */
export function parseConditionalProbability(notes: string | null | undefined): number | null {
  if (!notes) return null;
  
  // Match patterns like "95% conditional", "95% probability", "P=0.95", "95%"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:conditional|probability|prob)/i,
    /P\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    /conditional\s*[=:]\s*(\d+(?:\.\d+)?)\s*%?/i,
    /(\d+(?:\.\d+)?)\s*%/,
  ];
  
  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      // If value is > 1, treat as percentage
      return value > 1 ? value / 100 : value;
    }
  }
  
  return null;
}

/**
 * Format conditional probability for display
 */
export function formatConditionalProbability(
  downstreamEvent: string,
  upstreamEvent: string,
  probability: number | null
): string {
  if (probability === null) {
    return `P(${truncate(downstreamEvent, 20)} | ${truncate(upstreamEvent, 20)})`;
  }
  const pct = Math.round(probability * 100);
  return `P(${truncate(downstreamEvent, 20)} | ${truncate(upstreamEvent, 20)}) = ${pct}%`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
