// The ONE mapping from clinical trial status to reader state.
// Nothing else may hardcode these strings.

export type TrialState = "OPEN" | "PLANNED" | "CLOSED" | "UNKNOWN";

export interface TrialStateInfo {
  state: TrialState;
  tone: "accent" | "muted";
  /** terminated and suspended sink to the bottom of the list */
  sinksToBottom: boolean;
}

export function trialState(status: string | null | undefined): TrialStateInfo {
  const s = (status || "").trim().toLowerCase();
  if (s === "recruiting" || s === "enrolling by invitation") {
    return { state: "OPEN", tone: "accent", sinksToBottom: false };
  }
  if (s === "planned") {
    return { state: "PLANNED", tone: "accent", sinksToBottom: false };
  }
  if (s === "terminated" || s === "suspended") {
    return { state: "CLOSED", tone: "muted", sinksToBottom: true };
  }
  if (
    s === "active" ||
    s === "completed" ||
    s === "withdrawn"
  ) {
    return { state: "CLOSED", tone: "muted", sinksToBottom: false };
  }
  return { state: "UNKNOWN", tone: "muted", sinksToBottom: false };
}
