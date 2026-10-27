---
'@lowdefy/blocks-native': minor
'@lowdefy/shell': minor
'@lowdefy/server-dev': minor
'@lowdefy/helpers': patch
---

feat: Dictation in the native Composer and AgentChat inputs

- The native Composer and AgentChat inputs have a microphone button. It runs on-device dictation through `expo-speech-recognition`, shows a listening row with the partial transcript, and asks for microphone access with a warning and a Settings link when it is off. A spoken "for Sam, ..." in a Composer turns into a mention as typed text does.
- The shell carries `expo-speech-recognition` 58.0.0 in the basic profile, with the microphone and speech recognition usage strings. The shell's `nativeVersion` is now 2, so this needs a new native build.
- In Lowdefy Dev, `lowdefy_device` action `inject` takes kind `transcript` (`{ partials, final }` or `{ error }`) for what the next dictation session hears. With no injected transcript, Lowdefy Dev uses the phone's microphone.
- Development builds hide the dev menu's floating tools button.
