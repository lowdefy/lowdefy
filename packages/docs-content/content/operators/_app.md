# _app

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_app` operator reads structured app metadata declared in `lowdefy.yaml` together with build-environment facts captured by the build. It runs on the client, the server, and at build time.

The metadata object has the following keys:

  - `slug`: From the root `slug` field. **Required when referenced in string form** — `_app: slug` (or `_build.app: slug`) fails the build when `slug` is not declared in `lowdefy.yaml`. This guards against a `null` slug silently scoping namespaced data (e.g. MongoDB filters). The object form with an explicit `default` (`_app: { key: slug, default: ... }`) is the deliberate escape hatch: it returns the default instead of throwing, for the rare site that knowingly tolerates an unset slug. When set, the slug must be kebab-case (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`) — lowercase letters and digits, hyphen-separated, starts with a letter, no leading/trailing/consecutive hyphens, no underscores. An app that never references `slug` need not declare it.
  - `name`: From the root `name` field. Free-form string.
  - `version`: From the root `version` field. Free-form string.
  - `description`: From the root `description` field. Free-form string.
  - `license`: From the root `license` field. Free-form string.
  - `lowdefyVersion`: From the root `lowdefy` field — the framework version the app targets.
  - `gitSha`: The build's git commit SHA. Resolved at build time in three steps: the `LOWDEFY_GIT_SHA` environment variable (when set non-empty) wins; otherwise the build runs `git rev-parse HEAD`; if both fail (no `.git`, no `git` binary, env unset), `gitSha` is `null`. The build does not error in any case. Build-time and runtime reads return the same value.

Missing root fields yield `null` — every key in the metadata is always present. The sole exception is `slug`: referencing it fails the build when it is not set (see above).

Unknown keys return `null`. Dot-paths against the flat shape also return `null` (no exception).

#### Build time and runtime

`_app` resolves at **build time** and at runtime, and both produce the same value (app metadata is fixed at build). In most positions, write `_app: slug` — the build bakes it into the artifact. Inside a `_build.*` operator (for example as a [`_build.object.fromEntries`](/_build) map key), use the `_build.app` form so it resolves in time to be consumed by the surrounding build operator. See [`_build`](/_build).

#### Root metadata fields accept literals and `_build.*` only

The root metadata fields (`slug`, `name`, `description`, `version`, `license`, `lowdefy`) are resolved before the rest of the config, so they accept only literals and [`_build.*`](/_build) operators. `_ref`, `_var`, and static `_` operators are not resolved in these positions and fail the build with a clear error naming the field. Use `_build.env` for a deploy-time slug or name (for example `slug: { _build.env: APP_SLUG }`).

#### Pinning `gitSha` in deploy environments

Several common deploy paths strip `.git` before the build runs — Docker images that `COPY` only built output, hermetic PaaS sandboxes (Vercel, Netlify, Render), and CI runners with `actions/checkout` configured to fetch only a shallow tree without `.git`. In those environments, `git rev-parse HEAD` fails and `_app: gitSha` resolves to `null` unless `LOWDEFY_GIT_SHA` is set. Map your platform's commit env var via shell expansion in the build command:

| Platform        | Build command                                              |
| --------------- | ---------------------------------------------------------- |
| Vercel          | `LOWDEFY_GIT_SHA=$VERCEL_GIT_COMMIT_SHA lowdefy build`     |
| Netlify         | `LOWDEFY_GIT_SHA=$COMMIT_REF lowdefy build`                |
| Render          | `LOWDEFY_GIT_SHA=$RENDER_GIT_COMMIT lowdefy build`         |
| GitHub Actions  | `LOWDEFY_GIT_SHA=$GITHUB_SHA lowdefy build`                |
| Docker (CLI)    | `--build-arg LOWDEFY_GIT_SHA=$(git rev-parse HEAD)`        |

#### Arguments

###### string
If the `_app` operator is called with a string argument, the value of the key in the app metadata is returned. If the key is not found, `null` is returned. Dot notation is supported.

###### boolean
If the `_app` operator is called with the boolean argument `true`, the entire app metadata object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire app metadata object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the app metadata is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found. By default, `null` is returned if a value is not found.

#### Examples

###### Get the app slug:
```yaml
_app: slug
```
```yaml
_app:
  key: slug
```
Returns: The value of `slug` declared in `lowdefy.yaml`.

###### Get the app name:
```yaml
_app: name
```
Returns: The value of the root `name` field.

###### Get the entire app metadata object:
```yaml
_app: true
```
```yaml
_app:
  all: true
```
Returns: The full `{ slug, name, version, description, license, lowdefyVersion, gitSha }` object.

###### Return a default value if `gitSha` was not captured:
```yaml
_app:
  key: gitSha
  default: dev
```
Returns: The git SHA, or `"dev"` when unavailable (e.g. local dev with no `LOWDEFY_GIT_SHA` and no `.git`).

###### Scope a MongoDB request by app slug:
```yaml
filter:
  created.app_name:
    _app: slug
```
Returns: A filter document with `created.app_name` equal to the app's slug.

###### Show the version in a page title:
```yaml
title:
  _string.concat:
    - { _app: name }
    - ' v'
    - { _app: version }
```
Returns: e.g. `"My App v1.2.3"`.
