# Key Takeaways: Antd v6 Upgrade

> Distilled from plan + review. One file to read before starting implementation.

---

## Per-File Takeaways

### `cc-docs/architecture/antd-v6-upgrade-plan.md`

- **62 blocks** in blocks-antd, all need `.meta.styles` removed and testing
- **5 date blocks** use moment.js — must migrate to dayjs
- **9 blocks** use `makeCssClass(..., true)` for inline sub-element styles — these can't just be
  deleted, they need replacement (antd v6 `styles` semantic prop)
- **Modal.js line 68** directly passes `visible={openState}` to antd — must change to `open`
- **PageHeaderMenu and PageSiderMenu are custom composites** — they do NOT use antd's removed
  PageHeader component. Lower risk than the plan assumes.
- **Comment block exists** and wraps antd's removed Comment component. Must remove or rewrite.
- **Descriptions block already exists** — plan incorrectly lists it as "medium priority to add"
- **`antd/dist/antd.css`** is a full bundle (~500KB+), no tree-shaking. Acceptable tradeoff for
  simplicity.
- The plan's `class` YAML example has a **duplicate key bug** — can't have `class` twice in YAML

### `cc-docs/plan/antd-v6-upgrade-review.md`

- **`@layer` ordering is the #1 missed item** — without it, antd and Tailwind will fight.
  Must import as `@import 'antd/dist/antd.css' layer(antd)` and declare layer order.
- **Responsive styles have no clear post-emotion solution** — this is the hardest design decision.
  Options: build-time CSS, keep emotion just for this, or deprecate and push to Tailwind classes.
- **`style` and `styles.root` serve different purposes** — don't merge them. `style` = layout
  wrapper positioning. `styles.root` = component root styling.
- **Component token overrides partially work** in zeroRuntime — simple CSS variable values yes,
  algorithm-derived values no.
- **Phase order should be:** (1) Foundation + block migration combined, (2) slots rename,
  (3) styling architecture, (4) theme, (5) tailwind, (6) new blocks.
- **Multi-library support is scope creep** — remove from this plan, pursue separately.

---

## Corrected Facts

| Plan Says | Reality |
|-----------|---------|
| PageHeaderMenu uses removed PageHeader | Custom composite — no antd PageHeader import |
| Descriptions is a new block to add | Already exists as block #21 |
| `@ant-design/static-style-extract` for smaller CSS | Generates ALL component styles, not a subset |
| `antd.css` uses `@layer antd` automatically | Does NOT — must manually wrap in `@layer` |
| `class` can be string AND object on same block | YAML duplicate key — need union type handling |
| Component token overrides fully work in zeroRuntime | Only simple CSS var overrides — no derivation |

---

## What Definitely Works (Verified)

- `antd/dist/antd.css` + `ConfigProvider theme={{ zeroRuntime: true }}` — officially supported
- CSS variable naming: `--ant-color-primary`, `--ant-border-radius`, etc (camelCase → kebab)
- Component CSS vars: `--ant-button-default-bg`, `--ant-card-header-bg`, etc
- ConfigProvider still needed in zeroRuntime (for locale, sizing, CSS var values)
- SSR is **simpler** with zeroRuntime — no style extraction dance needed
- React 18.2.0 is sufficient — no React upgrade needed
- Row/Col grid system stable across v4→v6

---

## The Three Hardest Problems (In Order)

### 1. Responsive Styles Without Emotion

Currently `mediaToCssObject` + `@emotion/css` handles:
```yaml
style:
  sm: { fontSize: 12 }
  lg: { fontSize: 16 }
```

Emotion generates a class with `@media` queries. Without emotion, options are:
- **Build-time:** Convert responsive style objects to a CSS file during Lowdefy build. Each block
  gets a unique selector. Works, but adds build complexity.
- **Keep emotion for this:** Only use emotion for responsive `style` objects (not for class
  generation). Minimal footprint, but keeps the dependency.
- **Deprecate:** Tell users to use Tailwind responsive classes (`class: 'text-sm lg:text-base'`).
  Cleanest, but breaking change.

**Recommendation:** Build-time generation for v1. Deprecate in v2 after Tailwind is stable.

### 2. `@layer` Ordering With Tailwind

Tailwind v4 uses `@layer` internally. Antd's static CSS needs to be in a lower-priority layer.
The correct import order:

```css
@layer antd, tailwind-base, tailwind-components, tailwind-utilities;
@import 'antd/dist/antd.css' layer(antd);
@import "tailwindcss";
```

If this isn't set up correctly, either:
- Tailwind's preflight resets antd components (broken UI)
- Antd styles override Tailwind utilities (classes don't work)

Must be tested early — before any block migration work.

### 3. `class` Property Design

Need clear semantics:
```yaml
# String → applies to layout wrapper AND component root
class: 'my-card shadow-lg'

# Object → explicit sub-slot mapping
class:
  root: 'my-card shadow-lg'      # component root className
  header: 'bg-blue-500'           # antd classNames.header
  body: 'p-6'                     # antd classNames.body
```

When string: `classNames = { root: value }` — applied to both wrapper and component.
When object: each key maps to the corresponding antd `classNames` sub-prop.

Block components receive a flat `classNames` object — they don't know about the string/object
distinction. The engine normalizes before passing.

---

## Minimal Viable Upgrade (If Scope Must Be Cut)

If time is limited, the absolute minimum to get to antd v6:

1. Upgrade antd + icons + dayjs
2. Remove all .less files, add `antd/dist/antd.css` import
3. Fix all prop renames (`visible`→`open`, etc)
4. Wrap app in ConfigProvider with zeroRuntime
5. Remove `next-with-less` from server configs

This gets antd v6 working. Everything else (class property, slots rename, Tailwind, new blocks,
theme system) can come later in separate PRs.
