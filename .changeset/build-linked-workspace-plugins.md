---
'lowdefy': patch
---

fix(cli): Install and build workspace plugins before the server that links to them

Inside a pnpm workspace the generated server installs as its own workspace, and each `workspace:` plugin becomes a `link:` to its folder in the parent workspace. pnpm neither installs a link target's dependencies nor runs its build scripts, so on a fresh checkout, such as a Vercel or CI build, a plugin built by its `prepare` script had no `dist` and the Lowdefy build failed with `Cannot find module …/dist/types.js`. Before installing the server, the CLI now installs the plugins it links to in the parent workspace, with their workspace dependencies (`pnpm install --frozen-lockfile --filter <plugin>...` at the workspace root), which installs their dependencies and runs their build. The parent's lockfile is never rewritten: when it is out of date the install fails and names the workspace to run `pnpm install` in. This runs only when the server installs, as before, so a dev server that is already installed does not rebuild its plugins on every start.
