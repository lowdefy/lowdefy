# Framework versions

### Choosing a framework version

The `lowdefy:` field at the top of your `lowdefy.yaml` pins the framework version your app builds and runs against. You can pin an exact version (`lowdefy: 4.0.0`), a range, or one of the npm dist-tags below.

Lowdefy publishes three channels on npm:

| Channel        | Cadence                     | Validation                                                                 | Use it for                                         |
| -------------- | --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `latest`       | Stable releases             | Full release process                                                       | Production apps                                    |
| `known-good`   | Weekly                      | Promoted only after the canary passes against the docs app and the example app | Apps tracking pre-release work that still want a floor under them |
| `experimental` | Nightly                     | None — published straight from `main`                                      | Trying an unreleased fix; expect breakage          |

```yaml
# lowdefy.yaml
lowdefy: known-good
```

### Why `known-good` exists

An app that tracks unreleased framework work is, in effect, the framework's integration suite: every regression in a nightly build is found by a downstream app, usually mid-feature, and usually by someone who then has to work out whether their config is wrong or the framework changed under them.

`known-good` puts a floor under that. Each night the canary publishes an `experimental` candidate to npm and installs it — from npm, exactly the way your app does — into two apps: this documentation app and a small example app that exercises one page per feature area (a form with a state contract and required inputs, a list over a MongoDB collection, an `Api` endpoint with request and response schemas, a `_js` module reference, a `Template` block, `auth.dev.users` fixtures). For each candidate the canary runs:

- `lowdefy build` — the full build pipeline against the published packages,
- `lowdefy check` — static validation of the built app,
- `lowdefy test` — journeys and request tests (example app only).

A candidate that passes every leg is recorded. Once a week the newest passing candidate is promoted: the `known-good` dist-tag is moved onto it. A candidate that fails any leg is never promoted, so `known-good` only ever moves forward onto a build that compiled, validated and tested green.

`known-good` is **not** a nightly tag. It moves at most once a week, and only onto a candidate that has already been exercised end to end. If you want the very latest unvalidated build, pin `experimental` instead and expect to hit breakage the canary would otherwise have caught.

### When `known-good` breaks

Because every `known-good` build has already passed `build`, `check` and `test`, a failure you hit on `known-good` is almost certainly a framework bug in a code path the canary does not yet cover — not a mistake in your config to be worked around.

Please [report it](https://github.com/lowdefy/lowdefy/issues) with the failing config rather than pinning around it. A reproduction becomes a new case in the canary, which is how the covered surface grows.
