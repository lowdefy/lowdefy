# Lowdefy skills

This directory holds installable [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills) for working with Lowdefy. The `lowdefy-config` skill teaches an agent to look up exact block, operator, action, connection, and request types from a running Lowdefy dev server's docs API and MCP endpoint (`/lowdefy-docs`, `/lowdefy-docs/mcp`) instead of guessing type names or property shapes — see `packages/docs/concepts/ai-agent-docs.md` for how that server works.

To use a skill in your own Lowdefy project, copy its folder into your project's `.claude/skills/` directory (e.g. `.claude/skills/lowdefy-config/SKILL.md`), or install it with `npx skills add lowdefy/lowdefy`.
