---
'@lowdefy/blocks-native': patch
'@lowdefy/client-native': patch
---

fix(blocks-native): Markdown images show on phones

Images in the native Markdown block, AgentChat replies and ActivityTimeline comments did not show. react-native-marked's image sized itself with `Image.getSize` in an effect that ran on every render, had no height when the size could not be read, and loaded a path such as `/public/plan.png` with no server to load it from. Images now load through expo-image (svg included) at their own aspect ratio, no wider than they are or the text, with a rounded fill until they load and their alt text if they fail.

A path in a markdown image or link is taken against the app server's url, as a browser on the app's page reads it, through the new `components.resolveUrl` that `initNativeLowdefy` installs. A link such as `[Orders](/orders/42)` opens on the app server rather than failing in `Linking.openURL`.
