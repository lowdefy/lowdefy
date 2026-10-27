---
'@lowdefy/client-native': patch
'@lowdefy/blocks-native': patch
'@lowdefy/shell': patch
---

fix(client-native,blocks-native,shell): Keep inputs above the keyboard

On iOS a page's scroll view now adds the keyboard to its insets, so an input low on a long form scrolls above the keyboard. On Android, where apps are edge-to-edge and the window no longer resizes for the keyboard, a Screen footer, a sticky Composer and the shell's sign-in form now pad by the keyboard as they do on iOS, counting their distance from the top of the window, as the page sits below an opaque header (`useKeyboardWindowOffset`).
