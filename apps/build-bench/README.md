# build-bench

A large Lowdefy app for proving that a build change leaves the build output identical, and for measuring build time. It is built by `pnpm bench:build` and never run: there is no dev server, e2e suite or journey for it, and it needs no database or secrets to build.

```bash
pnpm bench:build apps/build-bench               # this checkout against the merge-base
pnpm bench:build apps/build-bench --self-check  # the baseline against itself
```

See `code-docs/testing.md` for the harness.

## What it is

The `apps/demo` app of [lowdefy/modules-mongodb](https://github.com/lowdefy/modules-mongodb) at tag `v1.4.1`, with its entity modules repeated in sets, so that the build is the size of a large production app.

| Sets (N) | `keyMap.json` | `refMap.json` | `build/` | Config build | Peak memory |
| -------- | ------------- | ------------- | -------- | ------------ | ----------- |
| 9        | 307 MB        | 15 MB         | 369 MB   | 33s to 37s   | 3.5 GB      |

Measured on 2026-10-29 with Lowdefy at `756bcab` (deterministic ref ids), on an M-series laptop that was running other builds at the time, so the times are an upper bound. The build has no errors and 59 warnings, all from the demo's and the modules' own config: 14 once and 5 in every set.

- **Shared modules, once**: layout, user-account, notifications, ai-assistant, events and files.
- **Repeated in sets**: activities, ai-reporting, companies, contacts, deals, release-notes, support, user-admin (with a second instance, `customer-user-admin`), walkthroughs and workflows. Set 1 has the demo's ids. Set _k_ suffixes each id with `-k` (`companies-3`), and its `dependencies:` wire it to its own set and to the shared modules.
- **The demo's own config**: pages, API endpoints, auth, connections, the `demo-assistant` agent and menus. The pages and the shared modules' vars point at set 1.
- **Modules** come from `github:lowdefy/modules-mongodb/modules/<name>@v1.4.1`. The first build downloads the tag into `.lowdefy/modules/` (gitignored) and every later build reuses it.
- **Plugins**: `@lowdefy/modules-mongodb-plugins`, `@lowdefy/community-plugin-xlsx` and `@lowdefy/community-plugin-nodemailer` from npm; `@lowdefy/plugin-aws` and `@lowdefy/connection-ai-gateway` from this repository (`workspace:*`), so each side of a bench build uses its own.
- **Lowdefy**: `lowdefy: local`. The app has no `package.json` and is not a workspace package.

## Known bias

The app is about 85k distinct YAML lines (77k in the modules at `v1.4.1`, 8k of its own), and most of the build's work is those lines repeated across the sets. A large production app's lines are mostly distinct pages. So anything that caches by file or by content, such as a parse cache, gains more here than on a real app. Measure such a change on a real app as well before quoting its gain.

## How the sets are made

Everything that repeats per set is written by `scripts/generate.mjs` and checked in as plain YAML. The build never runs the script.

```bash
node apps/build-bench/scripts/generate.mjs --sets 9
```

It writes:

- `modules.yaml`: set 1 with the shared modules, in the demo's order (workflows before companies, deals after every module it depends on), then each further set.
- `auth.yaml`: every set's user-admin roles for the role catalogue, its `user-admin-k/**` and `customer-user-admin-k/**` page and endpoint globs, and its `support-k/webhook` public endpoint. `lowdefy.yaml` reads each part by `key`.
- `menus.yaml`: the demo's menus (`scripts/menus.template.yaml`), plus a "Set k" menu group for each further set.
- `policies.yaml`: every set's ai-reporting dynamic blocks policy.
- `sets/set-k.yaml`: the vars set _k_ passes to the vars files: `ids`, the module entry ids of its own set.

One vars file serves every set. A set's module entry reads `modules/<name>/vars.yaml` by `_ref` with the set's vars file as `vars`, and the vars file reaches the other modules of its set through `ids`:

- an id operator takes it from `_var`: `_module.connectionId: { id: deals-collection, module: { _var: ids.deals } }`;
- a scoped page, connection or endpoint id is built with `_build.string.concat`: `[{ _var: ids.deals }, /view]`;
- a module `_ref` has to name its module literally, so the parts that hold one live in a `.yaml.njk` file rendered with `ids` (`modules/companies/sidebar_slots.yaml.njk`).

Nested refs pass `ids` on: a vars file that refs another file that needs them gives it `vars: { ids: { _var: ids } }`.

Changing N means running the script with the new N and committing its output, and recording the new sizes above.

## Differences from the demo

- `lowdefy: local`, the plugin versions above, and no `cli` section.
- `modules/companies/field-presets/` holds copies of the companies module's field presets, which the demo refs from outside the app.
- `modules/events/vars.yaml` sets `change_stamp.version` directly; the demo reads it from its `package.json`.
- The set modules' vars files take `ids`, as above, and the auth roles, menus and dynamic blocks policies come from the generated files.

## Moving to a newer modules-mongodb tag

Do it in its own pull request, with no Lowdefy change in it:

1. Compare the new tag's `apps/demo` with this app and carry its changes across, keeping the differences above.
2. Update `MODULES_TAG` and the dependency table in `scripts/generate.mjs` from the new module manifests, and run it.
3. Build it with `pnpm bench:build apps/build-bench --self-check`. The comparison must come out identical: a new tag changes the output, so its proof is the baseline against itself, not against the old tag.
4. Record the new sizes and warnings above and in the pull request.
