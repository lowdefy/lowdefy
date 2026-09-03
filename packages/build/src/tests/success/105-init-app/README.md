# 105: the app `lowdefy init` generates

The four config files `packages/cli/src/commands/init/templates` writes, rendered
with `lowdefy: local` and `name: init-app`. It is a fixture so the app every new
project starts from is built by CI: a broken template is a red build here, not a
broken `lowdefy dev` for whoever ran `init` that day.

`packages/cli/src/commands/init/init.test.js` asserts these files still match the
templates byte for byte, so the two cannot drift apart silently.
