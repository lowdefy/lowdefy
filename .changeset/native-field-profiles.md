---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
---

feat(mobile): NFC, background location, geofences, location, maps and signatures

`field` reads the phone's location for `GeolocationCurrentPosition` and draws the new `Map` block (Apple Maps on iOS, Google Maps on Android, with `LOWDEFY_GOOGLE_MAPS_API_KEY` at build time). `field-nfc` adds `ReadNfc` and `WriteNfc` for NDEF text and URI records. `field-tracking` adds `StartLocationTracking`, `StopLocationTracking`, `StartGeofencing` and `StopGeofencing`: points and region enter and exit post to API endpoints with the app closed, posts that fail wait for the next wake, and `onGeofence` fires while the app is open. The `SignaturePad` block draws a signature with a finger; its value is `{ svg, strokes, width, height }`, and every shell has it.
