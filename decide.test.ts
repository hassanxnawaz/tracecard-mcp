import assert from "node:assert/strict";
import { canonical, decide, fingerprint, type Row } from "./decide.ts";

const cases: Array<Row & { name: string; expect: string; fp: string }> = [
  { name: "qwen_rerun", delta_pp: 11, ci_low: -7, ci_high: 30, guardrail_over: true, task_regressed: false, target_improved: false, expect: "RERUN", fp: "ddd8c80582b8021d5abe3449732197753368c78cb19275e04192f0ee1157ee29" },
  { name: "clean_ship", delta_pp: 12, ci_low: 2, ci_high: 22, guardrail_over: false, task_regressed: false, target_improved: true, expect: "SHIP", fp: "8b6de9a54db8847def7d502627c5c862bd2c807e9c81a6fd35056dc5fc504bca" },
  { name: "gain_but_guardrail", delta_pp: 12, ci_low: 2, ci_high: 22, guardrail_over: true, task_regressed: false, target_improved: true, expect: "CHANGE", fp: "13fe8c9521a483afd7a44214ea53c22144a7b0ee6e2c3bb0fc62f43c322d19c4" },
  { name: "real_loss", delta_pp: -8, ci_low: -14, ci_high: -2, guardrail_over: false, task_regressed: true, target_improved: false, expect: "STOP", fp: "ef19fb28ecc72c37e9d296b41b92776c51ad13e39baae1e704c6c269d3057f98" },
  { name: "flat", delta_pp: -1, ci_low: -6, ci_high: 4, guardrail_over: false, task_regressed: false, target_improved: false, expect: "STOP", fp: "f15db289e44c90332827719aca6af9e01a85c6e8ef545cbadf5a977d1554fa50" },
  { name: "held_and_better", delta_pp: 2, ci_low: -3, ci_high: 7, guardrail_over: false, task_regressed: false, target_improved: true, expect: "SHIP", fp: "2ee6464ccc3ebbdecd7bebcc0b35f8dfdb19656361654923fa4cf9cd10d03fbe" },
  { name: "small_gain_guardrail", delta_pp: 2, ci_low: -3, ci_high: 7, guardrail_over: true, task_regressed: false, target_improved: true, expect: "RERUN", fp: "38575bd287988fc0f16b5e2848b542c1c464b4beb7b52087386ac867ab5f10cf" },
];

for (const row of cases) {
  assert.equal(decide(row), row.expect, row.name);
  assert.equal(await fingerprint(row), row.fp, row.name + " fingerprint");
  assert.ok(canonical(row).includes(`"delta_pp":${row.delta_pp}`));
}

console.log("tracecard-mcp tests passed");
