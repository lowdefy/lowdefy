---
'@lowdefy/shell': patch
---

fix(shell): Carry the shell's type manifest in its JavaScript bundle

The shell now checks pages against a type manifest bundled with its JavaScript (`src/plugins/typeManifest.js`), not the one in the Expo config. On an embedded launch the Expo config is the one the native build embedded, so a debug shell connected to Metro showed "Update the app to open this page" for a block type added since, such as the native `Markdown` block. A JavaScript-only block type now reaches a shell from Metro or by an over-the-air update, without a native build. The manifest is no longer in `extra.shell`. `pnpm --filter=@lowdefy/shell type-manifest` rewrites it after a change to the shell's plugins, and `pnpm release:version` rewrites it after the version bump.
