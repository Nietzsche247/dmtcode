/**
 * Probability display utilities for forecasts
 * Implements clamping and formatting rules
 */

// Maximum displayable probability (no event shows 100%)
const MAX_DISPLAY_PROBABILITY = 0.95;

/**
 * Clamp probability to max 95% for display
 * Events showing >=95% display as "~95%+" with tooltip explanation
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
      display: '~95%+',
      isClamped: true,
      tooltip: 'No unprecedented event receives 100% probability. All forecasts capped at 95%.'
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
 * Format conditional probability label: "X% IF [upstream] occurs"
 */
export function formatConditionalLabel(
  probability: number, 
  upstreamEvent?: string
): { display: string; isConditional: boolean } {
  const { display } = clampProbability(probability);
  
  if (!upstreamEvent) {
    return { display, isConditional: false };
  }
  
  const truncatedUpstream = upstreamEvent.length > 25 
    ? upstreamEvent.slice(0, 22) + '…' 
    : upstreamEvent;
  
  return {
    display: `${display} IF ${truncatedUpstream} occurs`,
    isConditional: true
  };
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
 * Format conditional probability for dependency hover display
 * Shows P(downstream | upstream) = X% with range if available
 */
export function formatDependencyHover(
  downstreamEvent: string,
  upstreamEvent: string,
  conditionalProbability: number | null,
  shiftRatio: number,
  confidenceFloor?: number | null,
  confidenceCeiling?: number | null
): string[] {
  const lines: string[] = [];
  
  // Conditional probability
  if (conditionalProbability !== null) {
    const pct = Math.round(conditionalProbability * 100);
    lines.push(`P(${truncate(downstreamEvent, 18)} | ${truncate(upstreamEvent, 18)}) = ${pct}%`);
  } else {
    lines.push(`P(${truncate(downstreamEvent, 18)} | ${truncate(upstreamEvent, 18)})`);
  }
  
  // Confidence range
  if (confidenceFloor != null && confidenceCeiling != null) {
    lines.push(`Range: ${Math.round(confidenceFloor * 100)}% - ${Math.round(confidenceCeiling * 100)}%`);
  } else if (confidenceFloor != null) {
    lines.push(`Floor: ${Math.round(confidenceFloor * 100)}%`);
  } else if (confidenceCeiling != null) {
    lines.push(`Ceiling: ${Math.round(confidenceCeiling * 100)}%`);
  }
  
  // Shift ratio
  lines.push(`Delay ratio: ${shiftRatio.toFixed(2)}x`);
  
  return lines;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
