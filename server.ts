import { decide, fingerprint, type Row } from "./decide.ts";

type Rpc = { jsonrpc?: string; id?: number | string; method?: string; params?: any };

const tools = [
  {
    name: "decide",
    description: "Turn a before/after completion interval into SHIP, CHANGE, RERUN, or STOP.",
    inputSchema: {
      type: "object",
      properties: {
        delta_pp: { type: "number" },
        ci_low: { type: "number" },
        ci_high: { type: "number" },
        guardrail_over: { type: "boolean" },
        task_regressed: { type: "boolean" },
        target_improved: { type: "boolean" },
      },
      required: ["delta_pp", "ci_low", "ci_high", "guardrail_over", "task_regressed", "target_improved"],
    },
  },
];

function frame(obj: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(obj));
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]);
}

async function handle(msg: Rpc): Promise<unknown | null> {
  if (msg.id === undefined) return null;
  if (msg.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "tracecard-mcp", version: "0.1.0" },
      },
    };
  }
  if (msg.method === "tools/list") {
    return { jsonrpc: "2.0", id: msg.id, result: { tools } };
  }
  if (msg.method === "tools/call" && msg.params?.name === "decide") {
    const row = msg.params.arguments as Row;
    const call = decide(row);
    const fp = await fingerprint(row);
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: { content: [{ type: "text", text: `${call}\n${fp}` }] },
    };
  }
  return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "method not found" } };
}

let buf = Buffer.alloc(0);
process.stdin.on("data", async (chunk: Buffer) => {
  buf = Buffer.concat([buf, chunk]);
  while (true) {
    const headerEnd = buf.indexOf("\r\n\r\n");
    if (headerEnd < 0) return;
    const header = buf.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) return;
    const len = Number(match[1]);
    const start = headerEnd + 4;
    if (buf.length < start + len) return;
    const raw = buf.slice(start, start + len).toString("utf8");
    buf = buf.slice(start + len);
    const reply = await handle(JSON.parse(raw));
    if (reply) process.stdout.write(frame(reply));
  }
});
