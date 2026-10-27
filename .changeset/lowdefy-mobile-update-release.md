---
'lowdefy': minor
---

feat(cli): Add `lowdefy mobile update` and `lowdefy mobile release`

`lowdefy mobile update` sends the shell's JavaScript over the air to the environment's EAS channel (`eas update`), with a message in a fixed form, `lowdefy-shell@<version> profile=<profile> runtime=<runtime version>`. `--rollout <percent>` sends it to a share of devices, `--promote` rolls the latest update for this runtime version out to every device (`eas update:edit --rollout-percentage 100`), and `--rollback` republishes the update before it (`eas update:republish --group`).

`lowdefy mobile release` is what CI runs. Per store it reads the latest finished build on the channel: when there is none, or its runtime version differs from the shell's, it raises the store version, builds and submits; when the runtime matches and the latest update carries another shell version (or none), it sends an update; otherwise it does nothing. It prints one line per store saying which and why. It always runs EAS without prompts; `--no-wait --auto-submit` queues builds and lets EAS submit them. `--dry-run` prints the reads and both paths per store, with the condition that picks each, and runs nothing.
