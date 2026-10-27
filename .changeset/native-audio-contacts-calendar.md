---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
---

feat(mobile): Voice notes, read aloud, keep awake, brightness, contacts and calendar

Every shell reads text aloud (`Speak`, `StopSpeaking`) and keeps the screen on (`KeepAwake`). `field` records voice notes (`StartRecording`, `StopRecording`, with `upload`) and sets the screen brightness for scan screens (`SetBrightness`, given back to the system when the app goes to the background); its microphone purpose text covers recording. The `contacts` extension adds `PickContact` and `AddContact`, and the `calendar` extension `AddCalendarEvent` and `GetCalendarEvents`.
