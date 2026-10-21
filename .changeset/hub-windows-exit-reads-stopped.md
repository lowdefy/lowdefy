---
'lowdefy': patch
---

fix(cli): A dev server that crashes while starting on Windows is reported as exited, not stopped

When a dev server the hub started (through `lowdefy mcp` and `lowdefy_dev_start`) crashed while starting on Windows, the hub could answer that it was `stopped`, as if another session had stopped it, with no exit code to show why. Windows reports the process as gone a moment before Node tells the hub it exited, and a status read in that moment found neither a running server nor a recorded exit.

The hub now waits for that exit to be recorded, so it answers `exited` with the exit code.
