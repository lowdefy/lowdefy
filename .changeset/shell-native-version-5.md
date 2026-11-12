---
'@lowdefy/shell': patch
---

fix(shell): Bump the shell's nativeVersion to 5 for @expo/log-box 58.0.15

The security update to `@expo/cli` 58.1.19 needs `@expo/log-box` 58.0.15, whose native iOS and Android code changed. Shells built on nativeVersion 4 cannot run JavaScript built against it, so the shell's runtime version moves to nativeVersion 5. Every shell needs a new native build before it takes over-the-air updates from this release.
