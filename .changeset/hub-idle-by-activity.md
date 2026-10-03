---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
---

feat: The dev server hub stops idle servers by last use, and bounds starts and browsers per machine

Coding agents that hand work to helper agents now leave far fewer dev servers running:

- **Idle by last use.** The dev server records when it was last used (any request through its port, a build) in `.lowdefy/instance.json`, and the hub stops a server it started once nobody has used it for 15 minutes and no browser tab has it open. Before, a server stayed up while any agent session was connected, and helper agents share their parent's connection, so their servers lived until the parent session ended. Status polls and long-lived event streams do not count as use. A stopped server starts again on the next `lowdefy_` call.
- **Memory pressure.** When the operating system reports memory pressure (macOS and Linux), the idle limit drops to 5 minutes, or 2 at critical pressure, and a start that would take the hub past four servers first stops the idle ones.
- **Start slots.** At most two dev servers launch at once across the machine (one at critical pressure); the rest queue in order. A start still queued after two minutes answers `queued` with its place, and calling `lowdefy_dev_start` again keeps it.
- **Browser slots.** At most three headless browser operations (journeys, screenshots, state inspections, operator evaluations, state loads) run at once across the machine, whichever way they were called. A slot held by a dev server that was killed is freed.
- **Agents are told.** The `lowdefy mcp` instructions, and the AGENTS.md and skill that `lowdefy agent-setup` writes for new setups, tell an agent to stop the dev server of a git worktree it created when it finishes there, and that a server left running stops after 15 idle minutes.

A dev server on an older `@lowdefy/server-dev` keeps the previous rule (30 minutes after the last agent session disconnected) and takes no browser slot.
