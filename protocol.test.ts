import { spawn } from "node:child_process";

function frame(obj: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(obj));
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]);
}

const child = spawn("node", ["--experimental-strip-types", "server.ts"], { stdio: ["pipe", "pipe", "inherit"] });
let buf = Buffer.alloc(0);
const replies: any[] = [];

function pump() {
  while (true) {
    const headerEnd = buf.indexOf("\r\n\r\n");
    if (headerEnd < 0) return;
    const header = buf.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) return;
    const len = Number(match[1]);
    const start = headerEnd + 4;
    if (buf.length < start + len) return;
    replies.push(JSON.parse(buf.slice(start, start + len).toString("utf8")));
    buf = buf.slice(start + len);
  }
}

child.stdout.on("data", (chunk: Buffer) => {
  buf = Buffer.concat([buf, chunk]);
  pump();
});

function send(obj: unknown) {
  child.stdin.write(frame(obj));
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "decide",
    arguments: { delta_pp: 11, ci_low: -7, ci_high: 30, guardrail_over: true, task_regressed: false, target_improved: false },
  },
});

setTimeout(() => {
  const call = replies.find((r) => r.id === 2);
  const text = call?.result?.content?.[0]?.text || "";
  if (!text.startsWith("RERUN\nddd8c80582b8021d5abe3449732197753368c78cb19275e04192f0ee1157ee29")) {
    console.error("bad reply", JSON.stringify(call));
    process.exit(1);
  }
  console.log("protocol test passed");
  child.kill();
  process.exit(0);
}, 800);
