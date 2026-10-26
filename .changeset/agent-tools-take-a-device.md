---
'@lowdefy/server-dev': minor
'@lowdefy/build': minor
'@lowdefy/shell': minor
'@lowdefy/node-utils': minor
'@lowdefy/docs-content': patch
'lowdefy': patch
---

feat(server-dev): Agent tools take a device

- `lowdefy_screenshot_page` and `lowdefy_run_journey` take `device`, a phone's tab id from the new `lowdefy_device list`. Steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot` and `expect` with `state`) run on the phone in Lowdefy Dev by block id. A screenshot is taken with `xcrun simctl io` on a simulator, `adb exec-out screencap` on an Android device, or by Lowdefy Dev from its own view on a paired phone, and says which.
- `lowdefy_inspect_state`, `lowdefy_snapshot_state` and `lowdefy_load_state` take `device` and read the phone's live state, or load a checkpoint into it.
- New `lowdefy_device` tool: `list` the connected phones, booted simulators and Android devices; `start` Lowdefy Dev on a simulator or emulator, as `lowdefy dev --ios` or `--android` does; `inject` a phone's next scan, photo, NFC read, location, permission answer, push or network state. On an iOS simulator a location and permission are also set with `simctl`, and a push is delivered with `simctl push`.
- `lowdefy_list_types` takes `target: web | mobile`; with `mobile` it lists the blocks, actions and client operators a native shell carries, which dev builds now write to `plugins/availableTypesMobile.json`.
- Client errors in `lowdefy_build_status` carry `surface` (`web` or `mobile`, with the phone's shell version).
- Lowdefy Dev names its platform and app id when it joins the dev server, and answers state checkpoint loads.
- The simulator and emulator helpers of `lowdefy dev --ios` and `--android` move to `@lowdefy/node-utils`, shared with the dev server.
