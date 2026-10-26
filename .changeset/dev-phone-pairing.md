---
'lowdefy': minor
'@lowdefy/server-dev': minor
---

feat(cli): `lowdefy dev --ios`, `--android` and `--lan` put the app on a phone

`lowdefy dev --ios` boots an iPhone simulator (or uses a booted one), installs Lowdefy Dev and opens the dev server in it. `--android` does the same on a connected phone or a running emulator, or starts the first Android virtual device, and connects it through `adb reverse`. Both reach the dev server on `localhost`, so nothing is exposed on the network. Until Lowdefy Dev builds are released, the build to install comes from `LOWDEFY_DEV_APP_IOS` (a simulator `.app`) or `LOWDEFY_DEV_APP_ANDROID` (an `.apk`). A missing `xcrun simctl` or `adb` stops the command with the install step to take.

`lowdefy dev --lan [interface]` lets a phone on the local network connect. The server also listens on the first private network address, or on the interface you name, and prints that interface with a QR code of a `lowdefy-dev://connect` link. The link carries a pairing token that lasts for the dev session. A request or websocket from another machine without the token is answered 401, and even with it the dev tools (`/lowdefy-docs` and its MCP endpoint, `/api/dev-inspect`, `/api/dev-recording`, `/api/dev-tools`, `/lowdefy-feedback`) refuse it and the headless-user cookie is ignored.

The dev mail sink prints the sign-in code of each email it catches (`code for ada@example.com: 482913`), which `lowdefy_dev_logs` also shows. `/api/client-error` in dev accepts requests with no Origin header, so errors from a simulator, a USB phone or a paired phone reach `lowdefy_build_status` like browser errors.
