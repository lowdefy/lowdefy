---
'lowdefy': minor
---

feat(cli): `lowdefy agent-setup` writes the same agent files from every app in a repository

The Lowdefy guidance and skills that `agent-setup` writes no longer name the app they were set up from. They drop the app's path, the `cd <app> &&` prefixes and the "Developers start it themselves with …" line, so running `agent-setup` from a second app in the same repository no longer rewrites them for that app.

Instead the guidance states how agents pick the app: a Lowdefy app is a folder containing `lowdefy.yaml`; `lowdefy_` tools use the app folder the session started in, else the repository's only app, and otherwise fail and list the apps. Agents pass the folder as `directory` when the developer named an app or a call listed several, and shell commands such as `lowdefy test` and `lowdefy journeys …` take it as `--config-directory <app>`. The journeys autopilot, which runs unattended, stops and lists the app folders instead of guessing when a repository holds several apps.
