# tracecard-mcp

The same ship, change, rerun, or stop call, as an MCP tool an agent host can ask.

TypeScript. Stdio. No dependencies. Tool name: `decide`.

It speaks the MCP content-length framing (`initialize`, `tools/list`, `tools/call`). The fingerprint matches [shipgate](https://github.com/hassanxnawaz/shipgate) and [markcard](https://github.com/hassanxnawaz/markcard), so the three runtimes agree before anyone argues about the call.

```bash
node --experimental-strip-types decide.test.ts
node --experimental-strip-types server.ts
```

## How this was built

Hassan Nawaz set the decision rule and the review bar. AI coding agents wrote the code under his direction. He reviews and decides what ships.

Designed and directed by Hassan Nawaz. Built by AI coding agents working under his direction.

MIT licensed.
