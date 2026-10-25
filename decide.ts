export type Row = {
  delta_pp: number;
  ci_low: number;
  ci_high: number;
  guardrail_over: boolean;
  task_regressed: boolean;
  target_improved: boolean;
};

export function decide(row: Row): "SHIP" | "CHANGE" | "RERUN" | "STOP" {
  if (row.ci_low > 0) return row.guardrail_over || row.task_regressed ? "CHANGE" : "SHIP";
  if (row.ci_high < 0) return "STOP";
  if (Math.abs(row.delta_pp) <= 5 && row.target_improved && !row.guardrail_over && !row.task_regressed) {
    return "SHIP";
  }
  if (row.delta_pp > 0 && row.ci_low <= 0 && row.ci_high >= 0) return "RERUN";
  return "STOP";
}

function num(v: number): string {
  return Number.isInteger(v) ? String(v) : String(v);
}

export function canonical(row: Row): string {
  return `{"ci_high":${num(row.ci_high)},"ci_low":${num(row.ci_low)},"delta_pp":${num(row.delta_pp)},"guardrail_over":${row.guardrail_over},"target_improved":${row.target_improved},"task_regressed":${row.task_regressed}}`;
}

export async function fingerprint(row: Row): Promise<string> {
  const data = new TextEncoder().encode(canonical(row));
  const sum = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(sum)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
