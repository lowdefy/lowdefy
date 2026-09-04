# Migration: `auth.dev.mockUser` becomes `auth.dev.users` + `auth.dev.browserUser`

## Context

From Lowdefy v8.0.0 there is one place a dev caller is declared and one selector that says which of them the browser is signed in as:

```yaml
auth:
  dev:
    users:
      admin:
        id: dev-admin
        roles: [admin]
      member:
        id: dev-member
        roles: [member]
    browserUser: admin
```

- `auth.dev.users` — the map of named callers. The dev server's headless tools (journeys, request tests, the MCP `user` parameter) take an entry name.
- `auth.dev.browserUser` — the name of the entry the developer's own browser is signed in as, bypassing login for the whole dev server. This is what `auth.dev.mockUser` used to do anonymously.

`auth.dev.mockUser` still works in v8 and emits a `ConfigWarning` (check slug `auth-dev-mock-user`); it is removed in v9. Declaring both `mockUser` and `browserUser` is a build error — they name the same thing.

`browserUser` must name a declared entry: a typo is a build error listing the declared names, where `mockUser` had no name to typo and `users` had no way to reach the browser.

The `lowdefy dev --mock-user '<json>'` flag and the `LOWDEFY_DEV_USER` environment variable are unchanged, and still take precedence over the config.

Why: three ways to name a caller (`mockUser`, `users`, and inline `user:` objects in tests) is two too many. The difference between `mockUser` and `users` was never a difference in _what_ is declared, only in _who reads it_.

## What to Do

### Step 1: Find the declaration

```bash
grep -rn 'mockUser' --include='*.yaml' --include='*.yml' --include='*.njk' .
```

There is at most one per app (`auth.dev.mockUser`), plus any `_ref`'d auth file.

### Step 2: Move it into `users` and select it

Give the user a name. If the app already declares `auth.dev.users`, check whether an existing entry has the same `id` and `roles` — if so, point `browserUser` at that entry instead of adding a duplicate.

### Step 3: Re-run the build

```bash
npx lowdefy@8 build 2>&1 | grep 'dev.mockUser'
```

Must print nothing.

### Step 4: Report

The file and line of the old `mockUser`, the entry name chosen, and whether it was merged into an existing `dev.users` entry or added as a new one. If two existing entries could plausibly be the browser user, say so and leave `browserUser` unset rather than guessing — the dev server then requires a normal login, which is safe.

## Scope

`app` — `lowdefy.yaml` and any `_ref`'d auth config.

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `mockUser`

## Examples

### Before

```yaml
auth:
  dev:
    mockUser:
      id: dev
      roles:
        - admin
```

### After

```yaml
auth:
  dev:
    users:
      dev:
        id: dev
        roles:
          - admin
    browserUser: dev
```

### Before — an app that already declares `users`

```yaml
auth:
  dev:
    mockUser:
      id: dev-admin
      roles: [admin]
    users:
      admin:
        id: dev-admin
        roles: [admin]
      member:
        id: dev-member
        roles: [member]
```

### After — merged, no duplicate entry

```yaml
auth:
  dev:
    browserUser: admin
    users:
      admin:
        id: dev-admin
        roles: [admin]
      member:
        id: dev-member
        roles: [member]
```

## Edge Cases

- **`--mock-user` / `LOWDEFY_DEV_USER`** take an inline JSON user and still win over the config. The flag is unchanged; do not rewrite scripts that use it.
- **A `mockUser` with keys `dev.users` does not accept** — `dev.users` entries take `id`, `name`, `email`, `roles`, `organizationId`, `organization_id`, `attributes` and `profile`. Anything else was silently carried through by `mockUser` and is now a build error; report it rather than dropping it.
- **A `browserUser` with no auth configured** is a runtime error: bypassing login still needs an auth block. Naming an entry under `dev.users` without selecting it as `browserUser` does not.
- **Inline `user:` objects in journeys and request tests** still work and are untouched by this codemod.

## Verification

```bash
npx lowdefy@8 build 2>&1 | grep -c 'auth-dev-mock-user'
```

Must print `0`. Then start `lowdefy dev` and confirm the browser lands signed in as the same caller: the header user menu shows the same id and the same roles gate the same pages.
