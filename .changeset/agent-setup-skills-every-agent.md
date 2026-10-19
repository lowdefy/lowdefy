---
'lowdefy': minor
---

feat(cli): `lowdefy agent-setup` writes Lowdefy's skills for every coding agent

- Each skill is written to both `.agents/skills/<name>/SKILL.md`, which Codex, Cursor, Copilot, Gemini, Amp and opencode read, and `.claude/skills/<name>/SKILL.md`, which Claude Code reads. They are plain copies, not symlinks.
- The two copies are one unit: a rerun refreshes both, and recreates a missing one, while neither was edited. Editing either copy freezes both, and agent-setup names the edited copy and its twin so you can copy the edit across, or delete both and rerun.
- `lowdefy-config` now carries a `lowdefy-skill-hash` and is refreshed on every run like the journeys skills. A `lowdefy-config` skill from an earlier agent-setup, which has no hash, counts as edited and is left: delete it and rerun to get the current one.
- Skills Lowdefy no longer ships are removed when unedited (their folder only when nothing else is in it); an edited one is left with a note that Lowdefy no longer maintains it. Skills without a `lowdefy-skill-hash` are never touched.
