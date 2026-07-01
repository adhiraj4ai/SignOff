# Changelog

All notable changes to SignOff are documented here. The project uses a single
fixed version across all `@signoff/*` packages and the desktop app. Format based
on [Keep a Changelog](https://keepachangelog.com/); versioning is pre-1.0 semver
(minor = features, patch = fixes).

## [0.2.0] — 2026-07-01

A large feature release: the approval model gained policy, risk-scaling, and new
document types, and the platform grew CI enforcement, reporting, and richer vault
metadata. All changes are additive and backward-compatible with 0.1.x vaults.

### Added
- **Claude Code integration** — a plugin + workflow skill and a one-click desktop
  "Connect Claude" flow, so a project can be wired to its vault from the app. (#17)
- **M-of-N approval policy** — `approval_mode` (`unanimous` | `threshold`) with
  `min_approvals`, so a workflow can require *N of M* listed approvers instead of
  everyone. Enforcement-honesty docs describe exactly what the gate guarantees. (#18)
- **GitHub enforcement** — `@signoff/ci` (`signoff-ci`), a required CI check that
  fails a PR unless its feature's gating document is approved in the vault, plus a
  reusable GitHub workflow that clones the vault and runs the check. (#19)
- **Approval-coverage reporting** — `@signoff/report` (`signoff-report`), a CLI that
  emits coverage + status breakdowns over a vault in Markdown or CSV. (#20)
- **Categories & tags** — organize features with a color-coded category and free-form
  tags; filter and group in the desktop sidebar. (#21)
- **Feature tiers** — `light` / `standard` / `heavy` scale the approval ceremony to
  risk: light gates code on the spec, standard/heavy on the plan, and heavy forces
  unanimous approval. (#22)
- **ADR document type** — architecture decision records as a first-class, *approvable
  but non-gating* document type (own workflow, status, and review UI); one per
  feature. The workflow skill records ADRs as decisions are made. (#23)
- **Diagram gating** — an optional per-workflow `require_diagram` setting; a spec/plan
  that needs a diagram (a `mermaid` block or an embedded image) cannot reach
  `approved` until it has one. New vaults require a diagram for the spec by default. (#24)
- **Ticket linking** — link a feature to one external tracker ticket (`id` + optional
  `url`); passed on publish (`ticket_id` / `ticket_url`) or edited in the desktop,
  where it renders as a clickable chip. Only `http(s)` URLs are opened. (#25)

### Changed
- Packaging hardened for publish: `@signoff/vault-core` and `@signoff/mcp-server`
  now ship only `dist/` via a `files` allowlist, with `types`, `prepublishOnly`
  builds, and `publishConfig.access: public`. Internal dependencies are pinned to
  `^0.2.0` (was `*`).
- The desktop app is marked `private` — it is distributed as an installer, not to npm.

### Notes
- Published `@signoff/*` libraries: `vault-core`, `mcp-server`, `superpowers-hook`,
  `ci`, `report`. `@signoff/claude-plugin` and the desktop app are not published to npm.
- The unreleased `0.1.2` working version is folded into this release.

## [0.1.1] — 2026-06-29

### Fixed
- Security & correctness fixes across the vault, gate, and desktop (code-review
  follow-ups from the initial cut).

## [0.1.0] — 2026-06-29

- Initial pre-release: vault-core (git + approval model), MCP server, superpowers
  gate hook, and the Electron desktop review app.

[0.2.0]: https://github.com/adhiraj4ai/signoff/releases/tag/v0.2.0
[0.1.1]: https://github.com/adhiraj4ai/signoff/releases/tag/v0.1.1
[0.1.0]: https://github.com/adhiraj4ai/signoff/releases/tag/v0.1.0
