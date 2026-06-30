# SignOff + Superpowers integration

SignOff gates implementation behind human approval of spec/plan documents.
Integration is **opt-in**: with no `signoff` MCP server and no `signoff-gate`
hook in `.claude/settings.json`, your skills behave exactly as before.

## Setup

You have three ways to turn on the gate. All put the vault at `<project>/.signoff`.

### Option A — Claude Code plugin (recommended)

```bash
claude plugin marketplace add adhiraj4ai/signoff
claude plugin install signoff@signoff --scope project
```

This installs the MCP server, the `signoff-gate` PreToolUse hook, and the
SignOff workflow skill. No path configuration — the plugin resolves the vault
from `${CLAUDE_PROJECT_DIR}/.signoff`.

> **Note:** the plugin invokes `@signoff/mcp-server` and `@signoff/superpowers-hook`
> via `npx` at runtime, so those packages must be available from npm (same
> prerequisite as Option B).

### Option B — Desktop "Connect to Claude Code"

In the SignOff desktop app, open the vault menu in the status bar and click
**Connect to Claude Code**. This writes `<project>/.claude/settings.json` with
the MCP server and hook entries (via `npx`, so the `@signoff/mcp-server` and
`@signoff/superpowers-hook` packages must be installable from npm).

### Option C — Manual

Add the MCP server and hook to `.claude/settings.json` yourself — see
`docs/signoff-settings-example.json`.

## How it works

- **The hook (`signoff-gate`)** is a *local, fail-closed* gate. On every `Write`/`Edit`/
  `MultiEdit`/`NotebookEdit` it checks the active feature's approval status:
  - writes under `docs/superpowers/specs/` — always allowed
  - writes under `docs/superpowers/plans/` — require the spec to be **approved**
  - any other file (code, tests, config) — require the plan to be **approved**
  - no active feature published yet — blocked
- **The publish convention** is how Claude tells SignOff which feature is
  active. After brainstorming writes a spec, call
  `publish_document(source_path, feature_name, "spec")`. After writing-plans
  writes a plan, call `publish_document(source_path, feature_name, "plan")`.
  Publishing writes `.signoff/active-feature.json` in your project, which the
  hook reads.

If Claude forgets to publish, the hook still blocks code changes — publishing
smooths the workflow. The hook is a **cooperative** check: it runs on the developer's machine and can be
bypassed (a write through `Bash` such as `echo > foo.ts`, or simply not installing the
hook, is not caught). It is fail-closed where it *does* run, but the **un-bypassable**
gate is server-side — branch protection plus a required CI check that fails a pull
request when the linked spec/plan isn't approved. That server-side check is the next
item on the roadmap; until it lands, treat the hook as a strong guardrail, not a hard
guarantee.

## Known limitation (v1)

The hook gates the structured edit tools. A write performed through `Bash`
(e.g. `echo > foo.ts`) is not gated in v1.
