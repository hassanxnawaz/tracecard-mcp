# tracecard-mcp

The same ship, change, rerun, or stop call, as an MCP tool an agent host can ask.

TypeScript. Stdio. No dependencies. Tool name: `decide`.

It implements Content-Length framing for JSON-RPC requests (`initialize`, `tools/list`, `tools/call`). The fingerprint matches [shipgate](https://github.com/hassanxnawaz/shipgate) and [markcard](https://github.com/hassanxnawaz/markcard), so the three runtimes agree before anyone argues about the call.

```bash
node --experimental-strip-types decide.test.ts
node --experimental-strip-types server.ts
```

## Send a decision on stdin

Run from this directory with Node.js 22.6+ and TypeScript stripping enabled.
Unlike shipgate, this server does not accept a bare decision object. Each request
is a JSON-RPC envelope with a `Content-Length: <UTF-8 byte count>` header,
then `\r\n\r\n`, then the JSON body. Responses use the same framing.
This is the framing implemented here, not the newline-delimited JSON used by
current MCP stdio clients; those clients need a framing adapter.

For a direct stdin smoke check, this sends one `tools/call` request with all six
required arguments. Use JSON numbers and booleans, not strings.

```bash
node <<'JS' | node --experimental-strip-types server.ts
const body = Buffer.from(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "decide",
    arguments: {
      delta_pp: 11,
      ci_low: -7,
      ci_high: 30,
      guardrail_over: true,
      task_regressed: false,
      target_improved: false
    }
  }
}));
process.stdout.write(Buffer.concat([
  Buffer.from("Content-Length: " + body.length + "\r\n\r\n"),
  body
]));
JS
```

The response has `id: 1`. Its `result.content[0].text` contains:

```text
RERUN
ddd8c80582b8021d5abe3449732197753368c78cb19275e04192f0ee1157ee29
```

The +11-point gain still crosses zero (interval -7 to 30), so the call is RERUN.
The decision is in the response, not the process exit code: the server stays
available for more requests until stdin closes.

To test the initialization handshake and the same decision call, run:

```bash
node --experimental-strip-types protocol.test.ts
```

Built by Hassan Nawaz.

MIT licensed.
