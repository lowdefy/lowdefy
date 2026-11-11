---
'lowdefy': patch
---

feat(cli): Agent rules say which level of test to use

The rules `lowdefy agent-setup` writes told agents to verify every change by running journeys and to widen to `tier: edge` before calling it done. Journeys run a real browser, so agents spent long stretches checking logic and permissions that a direct call would cover, and journeys with no production counts run in every tier, so the wider tier could mean nearly the full suite. The rules now send logic, permissions and writes to a request or endpoint call and keep journeys for what needs a browser. Agents run only the journey they changed while fixing, the journeys a change touches before calling it done, and the full suite only when a person asks or in the app's scheduled run. Agents run each journey once: only the journey skills repeat a journey, and only one they wrote. journeys-autopilot now runs a developer's existing suite once instead of three times.
