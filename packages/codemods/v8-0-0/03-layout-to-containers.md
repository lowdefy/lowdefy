# Migration: per-block `layout:` to the `Row`, `Grid` and `Stack` container blocks

## Context

From Lowdefy v8.0.0, arrangement is expressed with three framework-owned container blocks —
`Row`, `Stack` and `Grid` — plus Tailwind utility classes on the children. The container says how
the children are arranged; each child says how big it is.

**`layout:` is deprecated, not removed. It keeps working in v8 and this migration is optional.**
Whether `layout:` is removed in v9 is a decision taken on how much config still uses it, which is
what `lowdefy check` now counts.

`lowdefy check` reports every site under the `layout-deprecated` slug, one warning per site with
the wrapper that site needs, and a final line counting the sites and files. Suppress it per config
object with `~ignoreBuildChecks: [layout-deprecated]` if an app is deliberately staying on
`layout:`.

The mapping:

| `layout:`                    | Replacement                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `span`, `offset` on siblings | Wrap them in a `Grid` (`columns: 24`); `class: col-span-N col-start-N`  |
| `flex`, `grow`, `shrink`, `size` | Wrap them in a `Row`; `class: grow`, `shrink-0`, `basis-[120px]`   |
| an area with `direction: column` | Wrap its children in a `Stack`                                     |
| `selfAlign`                  | `class: self-start` / `self-center` / `self-end`                        |
| area `gap`, `align`, `justify`, `wrap` | the container block's `properties`                            |
| area `overflow`              | `class: overflow-auto` on the container                                 |

## What to Do

### Step 1: Count the sites

```bash
npx lowdefy@8 check 2>&1 | tee check-output.txt
grep -c 'layout: is deprecated' check-output.txt
```

The last `layout-deprecated` warning is the summary: `layout: is deprecated: N sites in M files.`
If `N` is small, do the rewrite by hand from the per-site warnings and skip to Step 4. If it is
large, run the deterministic core in Step 2.

### Step 2: Run the deterministic core over every page

`@lowdefy/codemods` ships `lib/layoutToContainers/`, a dependency-light Node module (it needs only
`yaml`) that rewrites one parsed page document and returns a report. It edits the YAML through the
`yaml` document API, so comments survive.

```js
// rewrite.mjs — run from the app directory
import fs from 'fs';
import { globSync } from 'node:fs';
import { parseDocument } from 'yaml';
import layoutToContainers from './.lowdefy/codemods/lib/layoutToContainers/index.js';

for (const file of globSync('**/*.yaml', { exclude: (name) => name.startsWith('.') })) {
  const source = fs.readFileSync(file, 'utf8');
  const { config, report } = layoutToContainers({ config: parseDocument(source) });
  if (report.length === 0) continue;
  fs.writeFileSync(file, config.toString());
  report.forEach((entry) => console.log(`${file} ${entry.path} [${entry.action}] ${entry.message}`));
}
```

```bash
node rewrite.mjs 2>&1 | tee layout-report.txt
```

Every report entry carries an `action`:

- `rewrite` — done. The named blocks are now inside the named container.
- `review` — rewritten, but the result may not be pixel-identical. Read the message and check the
  page. The two that matter: a run whose offsets accumulate past 24 columns, and a column area
  whose children carried `span`.
- `dynamic` — **not rewritten**. The `layout:` (or one of its keys) is operator-valued, so no
  static class can stand in for it. Convert it by hand: `class: { _if: … }` returning the class
  strings the two branches need.
- `manual` — **not rewritten**. Responsive breakpoint objects (`xs`, `sm`, `md`, `lg`, `xl`,
  `2xl`), `push`, `pull`, `disabled`, `direction: column-reverse`, and a child whose own
  `offset + span` exceeds 24 columns. Rewrite these by hand or leave them on `layout:` — it still
  works.

Never let the core write a file and then move on: the whole point of the report is that the sites
it refused are the ones a person has to look at.

### Step 3: Do the `dynamic` and `manual` sites by hand

For each `dynamic` entry, read the original operator and write the class form:

```yaml
# before
layout:
  span:
    _if:
      test:
        _state: wide
      then: 24
      else: 12

# after — inside a Grid with columns: 24
class:
  _if:
    test:
      _state: wide
    then: col-span-24
    else: col-span-12
```

For each `manual` entry, either write the responsive classes yourself (`col-span-24 md:col-span-8`)
or leave the block on `layout:`. Both are valid v8 config.

### Step 4: Check the rendered DOM did not move

This migration changes the DOM: a `Grid` or `Row` is a new element around blocks that used to be
siblings. Snapshots are the only thing that proves the rendered result is the same.

```bash
npx lowdefy@8 snapshot --check
npx lowdefy@8 test
```

`snapshot --check` compares the DOM, the state and a screenshot of every page in
`tests/snapshots.yaml` as every dev user. **DOM drift is fatal: a changed DOM snapshot means the
rewrite changed the page.** Pixel drift is advisory by default (rendering differs between
machines), so read it, do not chase it.

**Never commit a page whose DOM snapshot changed without a stated reason.** Either revert that
page's rewrite and leave it on `layout:`, or write the reason into the commit message and update
the snapshot deliberately with `npx lowdefy@8 snapshot --update --pages <pageId>`.

### Step 5: Re-count

```bash
npx lowdefy@8 check 2>&1 | grep 'layout: is deprecated'
```

The count should be down to the sites deliberately left behind.

## Scope

`app` — all YAML config files including Nunjucks templates (`.yaml.njk`), shared components,
module files and archetype definitions. Any file that defines blocks.

## Files to Check

Glob: `**/*.{yaml,yml,njk}`
Grep: `layout:`

A `.yaml.njk` template is not valid YAML until it is rendered, so the deterministic core cannot
parse it. Rewrite templates by hand, from the `lowdefy check` warnings.

## Examples

### Before — a span row

```yaml
- id: dashboard
  type: Box
  slots:
    content:
      gap: 16
      blocks:
        - id: chart
          type: EChart
          layout:
            span: 16
        - id: totals
          type: Card
          layout:
            span: 6
            offset: 2
```

### After

```yaml
- id: dashboard
  type: Box
  slots:
    content:
      blocks:
        - id: dashboard_grid_1
          type: Grid
          properties:
            columns: 24
            gap: md
          blocks:
            - id: chart
              type: EChart
              class: col-span-16
            - id: totals
              type: Card
              class: col-span-6 col-start-19
```

`offset` is a cumulative margin, so `totals` starts at column `16 + 2 = 18` — `col-start-19`, since
grid lines are 1-based.

### Before — a flex toolbar

```yaml
- id: toolbar
  type: Box
  blocks:
    - id: search
      type: TextInput
      layout:
        grow: 1
    - id: refresh
      type: Button
      layout:
        shrink: 0
```

### After

```yaml
- id: toolbar
  type: Box
  blocks:
    - id: toolbar_row_1
      type: Row
      blocks:
        - id: search
          type: TextInput
          class: grow
        - id: refresh
          type: Button
          class: shrink-0
```

## Edge Cases

- **Generated container ids** are `<parentId>_grid_1`, `<parentId>_row_2`, `<parentId>_stack_1` —
  namespaced under the parent block's id, numbered per parent in document order. They are block
  ids, so they are state paths: a segment may not be empty or start with `~`. If a container id
  collides with an existing block id on the page, rename the generated one.
- **A block with no `id`** cannot have a container namespaced under it. Those slots are reported
  and left alone.
- **A partial run** — some siblings carry `span`, some do not, and something in between is refused
  — leaves the area's `gap`/`align`/`justify` where they are, because the area still holds children
  outside the new container. Only a container that replaces the whole area takes the area's
  properties.
- **`gap` in pixels** maps to the nearest `gap` token (`none` 0, `xs` 4, `sm` 8, `md` 16, `lg` 24,
  `xl` 32); a tie rounds down. Any rounding is reported as `review`.
- **`Grid` has no `align`, `justify` or `wrap` property** — those become `items-*` and `justify-*`
  classes on the `Grid`, and a `wrap` on a grid area is reported rather than translated.
- **A run that overflows 24 columns** is rewritten, but the grid's own wrap point is only the same
  as the flex wrap point while every wrapped row repeats the first row's offsets. Read the page.
- **`layout:` on a page's root block** describes the page's own content area. It is handled the
  same way as any other container's area.

## Verification

```bash
npx lowdefy@8 check 2>&1 | grep 'layout: is deprecated'
npx lowdefy@8 snapshot --check
npx lowdefy@8 test
```

`snapshot --check` must report no DOM drift. Every page that does is either reverted or has its
reason written down.
