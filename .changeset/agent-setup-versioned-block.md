---
'lowdefy': minor
---

feat(cli): `lowdefy agent-setup` keeps Lowdefy's guidance as a versioned block and makes Claude Code read AGENTS.md

- The guidance is written between `<!-- BEGIN:lowdefy-agent-rules version=<version> -->` and `<!-- END:lowdefy-agent-rules -->`, stamped with the version of the CLI that wrote it, and the whole block is rewritten on every run. Text outside the markers is never touched.
- An existing block is replaced where it is, in `AGENTS.md` or `CLAUDE.md`. Otherwise the block is appended to `AGENTS.md` when it exists, else to `CLAUDE.md` when that is all the project has (no `AGENTS.md` is created), else to a new `AGENTS.md`.
- When the block is in `AGENTS.md`, the root `CLAUDE.md` imports it: agent-setup creates a `CLAUDE.md` holding `@AGENTS.md` when there is none, and adds the line to the top of one that lacks it, since Claude Code otherwise skips `AGENTS.md`. `.claude/CLAUDE.md` and `CLAUDE.local.md` are never edited.
- When the CLI's version differs from the app's `lowdefy.yaml` version, agent-setup still writes and warns with the command that matches them, for example `npx lowdefy@7.0.0 agent-setup`.
- Apps on `lowdefy: local` are not supported: agent-setup stops with an error and writes nothing.
- An unmarked `## Lowdefy` section written by an earlier agent-setup is no longer updated; the block is appended after it. Delete the old section by hand.
