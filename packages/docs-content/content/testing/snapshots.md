# Golden Snapshots

# Golden Snapshots

A **snapshot** is a committed record of what a page looks like for a given user: a screenshot, the rendered DOM and the page state. `lowdefy snapshot --update` captures them, `lowdefy snapshot --check` fails when the current app renders differently. A reviewer supervising a change — a colleague's or an AI agent's — does not have to read a long YAML diff to know what it did; they can look at "the controls page changed for a member" and at the pixel diff.

Snapshots complement [config tests](/config-tests): a journey asserts that a flow works; a snapshot catches everything you did not think to assert on.

## What a snapshot contains

Every page × user pair is written to `snapshots/<pageId>/<user>/` in the config directory, as three files formatted for a readable git diff:

| File             | Content                                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `screenshot.png` | The viewport (1280 × 800) rendered headless with reduced motion, the light colour scheme, the `en-US` locale and the `UTC` timezone, after the page's `onInit`, `onMount` and initial requests settled. |
| `dom.html`       | The app root's HTML, one tag per line, with generated values normalised: Ant Design hash classes become `css-[HASH]`, `rc_select_<n>` ids become `rc-select-[N]`, ISO timestamps `[TS]`, UUIDs `[UUID]`. |
| `state.json`     | The page's `state`, pretty-printed with sorted keys. Request results and the event log are call logs, not rendered output, so they are not captured.                                                     |

Snapshots are taken through the development server's `GET /lowdefy-docs/snapshot/{pageId}` route (also the `lowdefy_snapshot` MCP tool), so an agent can take a single snapshot to see what its change did without running the whole set. Commit the `snapshots/` directory; add `.lowdefy/` to `.gitignore` if it is not already — the pixel diffs `--check` writes live under `.lowdefy/snapshot-diff/`.

## Running

```bash
# Capture (or re-capture) the goldens
pnpx lowdefy@5 snapshot --update

# Fail if the app renders differently
pnpx lowdefy@5 snapshot --check
```

Exactly one of `--check` and `--update` is required. The command starts the development server headless on a free port, resolves which pages to capture as which users, takes each snapshot and stops the server. Options:

- `--pages controls,control`: Only these page ids.
- `--users admin,member`: Only these `auth.dev.users` names.
- `--pixel-tolerance 0.001`: The fraction of changed pixels above which a screenshot counts as drift. The default is `0.001` (0.1%), which absorbs font anti-aliasing while catching a moved or missing block.
- `--port`, `--config-directory`, `--dev-directory`, `--log-level`, `--disable-telemetry`, `--ref-resolver`: As for `lowdefy dev`.

`--check` prints one line per differing artefact — `FAIL controls as member snapshots/controls/member/dom.html` followed by the first 20 differing DOM lines, the changed state paths with both values, or the changed-pixel count and the path of the `diff.png` it wrote — and exits with code `1`. A snapshot that has never been captured is drift too: a page nobody has looked at should not pass.

## Users

Snapshots are taken as the users declared under `auth.dev.users` in `lowdefy.yaml`, so a role-gated page is captured once per role:

```yaml
auth:
  dev:
    users:
      admin:
        id: admin
        roles: [admin]
      member:
        id: member
        roles: [member]
```

Without dev users, each page is captured once as the default roleless headless user, under `snapshots/<pageId>/headless/`.

## The manifest

With no `tests/snapshots.yaml`, every page is captured for every dev user. A manifest narrows that and adds a query or a journey:

```yaml
# tests/snapshots.yaml
pages:
  - pageId: controls
    users: [admin, member]
  - pageId: control
    users: [admin]
    urlQuery: { slug: iso-27001 }
    journey: tests/journeys/open-detail.yaml
```

- `users`: Dev user names. Omitted, every dev user is used.
- `urlQuery`: Query parameters the page is opened with, read by `_url_query`.
- `journey`: A [journey file](/config-tests) whose steps run before the snapshot is taken — to capture a modal open or a filter applied, not only the initial render. Only the journey's steps are used; the page and user come from the manifest entry. A journey step that fails is an error for that snapshot, not a golden of the wrong state.

`--pages` and `--users` filter whatever the manifest resolves to.

## Ignoring state paths

State that legitimately differs between two renders — a relevance score, a `created_at` set on load — would make every check fail. Declare those paths on the page with `~snapshotIgnore`; `$` matches any array index:

```yaml
id: controls
type: PageHeaderMenu
~snapshotIgnore:
  - search.results.$.score
  - form.created_at
```

The paths are removed from both the golden and the current state before they are compared. They only affect `state.json`; the DOM and screenshot comparisons rely on the normalisation above and the pixel tolerance.

## Reviewing an agent's change

1. Before the change, `lowdefy snapshot --update` on a clean tree and commit the goldens.
2. Let the agent make its change.
3. `lowdefy snapshot --check`. Every page × user it prints is one the change affected; the `diff.png` under `.lowdefy/snapshot-diff/` shows where, `dom.html` shows which element, `state.json` shows which value.
4. If the drift is intended, `lowdefy snapshot --update` and commit the new goldens with the change — the review of the config diff and the review of what it renders travel together.

## Continuous integration

```yaml
# .github/workflows/snapshots.yml
- run: pnpm install
- run: npx playwright install chromium
- run: pnpx lowdefy@5 snapshot --check
```

The dev server drives Chromium through `playwright-core`, so the runner needs a browser installed. Two `--update` runs on unchanged config produce byte-identical `dom.html` and `state.json`; the screenshot can differ by a handful of anti-aliased pixels between machines, which `--pixel-tolerance` absorbs. If your CI renderer differs enough from your workstation to fail, capture the goldens in CI and commit them from there.
