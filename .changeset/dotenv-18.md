---
'lowdefy': patch
'@lowdefy/server-dev': patch
---

fix(deps): Update dotenv to 18.0.10

The CLI and dev server now pass dotenv's `quiet` option, so loading an app's `.env` file stays silent (dotenv 17 started logging each load by default; the `silent` option they passed before was never a dotenv option). dotenv 18 drops `.env.vault` decryption with `DOTENV_KEY` and preloading, neither of which Lowdefy used or documented.
