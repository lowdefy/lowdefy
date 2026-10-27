---
'@lowdefy/shell': minor
'@lowdefy/client-native': minor
'@lowdefy/client-core': minor
'@lowdefy/engine': minor
'@lowdefy/server-dev': patch
---

feat(shell): Lowdefy Dev fakes device results for agents and records what you do on the phone

- The dev-tab client answers `inject` requests: the next scan, photo or NFC read, a location or a route of them, a permission answer, and network offline or online. While offline, every fetch the app makes fails as it does with no network. Push injection is refused until the shell carries `expo-notifications`.
- Device actions read injections through one helper, `injected(name)`, which returns nothing in a release shell. `GeolocationCurrentPosition` answers on the phone with an injected location, or a denied permission, in the web action's shape.
- Lowdefy Dev records clicks, changes, Enter presses and page views by block id in the web recorder's record shape, labelled with the device and shell version, so `lowdefy journeys session` lists and prints phone sessions. Password inputs are never recorded.
- The engine trace gains `reportInteraction` and `subscribeInteractions`, and the native renderer reports block presses and changes through them. The recorder's record building moves to `@lowdefy/client-core`, shared by the web and phone recorders.
- A release shell no longer links `expo-sensors`, `react-native-view-shot` or, unless its shell config's `capabilities` include `camera`, `expo-camera`, and asks for none of their permissions. `check:release-bundle` runs `expo prebuild` and fails a release shell that still links them or asks for the camera it does not need.
