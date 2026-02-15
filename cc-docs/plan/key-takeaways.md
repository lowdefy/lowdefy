# Key Takeaways: Antd v6 Upgrade

> Distilled from plan (rev 2) + review (rev 2). One file to read before starting implementation.

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
- The plan's `class` YAML example has a **duplicate key bug** — can't have `class` twice in YAML
- **Use default CSS-in-JS mode** with `StyleProvider layer`, NOT `zeroRuntime`

### `cc-docs/plan/antd-v6-upgrade-review.md`

- **Switching from `zeroRuntime` to default mode resolved 7 critical issues** — `@layer`
  automation, tree-shaking, algorithm support, token derivation, bundle size, SSR, and the
  `static-style-extract` misunderstanding
- **Responsive styles remain the hardest open question** — build-time CSS generation or deprecate
  in favor of Tailwind responsive classes
- **`style` and `styles.root` serve different purposes** — don't merge them. `style` = layout
  wrapper positioning. `styles.root` = component root styling.
- **Multi-library support is scope creep** — separate initiative after antd v6 is stable
- **Phase 1+2 should be combined** — can't validate antd v6 without fixing prop renames
- **`@ant-design/nextjs-registry` needs Pages Router verification** — Lowdefy uses Pages Router
  on Next 13.5.4, registry may target App Router

---

## The Core Architecture Decision

**Use antd v6 default mode, not `zeroRuntime`. No SSR extraction needed.**

```jsx
// _app.js — inside the existing App component
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';

<StyleProvider layer>
  <ConfigProvider theme={lowdefy.theme}>
    {children}
  </ConfigProvider>
</StyleProvider>
```

**Why default mode:** Tree-shaking (only CSS for used components), full algorithm support (dark
mode from one config line), automatic `@layer antd` wrapping, complete token derivation. The v6
CSS-in-JS runtime is lightweight — one-time injection per component type using CSS variables.

**Why no SSR extraction:** Lowdefy's `_app.js` uses `dynamic(..., { ssr: false })`. The entire
app renders client-side. No `@ant-design/nextjs-registry`, no `extractStyle()`. Antd injects
styles client-side after hydration — same as what Lowdefy already does with emotion.

---

## Corrected Facts

| Originally Said | Reality |
|-----------------|---------|
| Use `zeroRuntime` with `antd/dist/antd.css` | Use default mode — tree-shaken, full features |
| `StyleProvider layer` is enough for Tailwind | **No** — must also pre-declare `@layer` order in CSS |
| Need `@ant-design/nextjs-registry` for SSR | **No** — Lowdefy is client-only (`ssr: false`) |
| Algorithms (dark/compact) require special handling | Work out of the box via ConfigProvider |
| Token→CSS-var mapping needs build-time generation | ConfigProvider does it at runtime |
| PageHeaderMenu uses removed PageHeader | Custom composite — no antd PageHeader import |
| Descriptions is a new block to add | Already exists as block #21 |
| `antd.css` is ~500KB+ full bundle | Not relevant — default mode tree-shakes |
| `class` can be string AND object on same block | YAML duplicate key — union type (string OR object) |
| Component token overrides have limitations | Full support with default mode |

---

## What Definitely Works (Verified)

- `StyleProvider layer` wraps all antd styles in `@layer antd` — Tailwind utilities override cleanly
- CSS variable naming: `--ant-color-primary`, `--ant-border-radius`, etc
- `ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}` — full dark theme from seed tokens
- Component-level overrides with full derivation (hover states, palettes)
- React 18.2.0 is sufficient — no React upgrade needed
- Row/Col grid system stable across v4→v6
- Tree-shaking — only CSS for components that actually render gets injected

---

## The Hardest Remaining Problem

### Responsive Styles Without Emotion

Currently `mediaToCssObject` + `@emotion/css` handles:
```yaml
style:
  sm: { fontSize: 12 }
  lg: { fontSize: 16 }
```

Emotion generates a class with `@media` queries. Without emotion, options are:
- **Build-time CSS generation:** Convert responsive style objects to a CSS file during Lowdefy
  build. Each block gets a scoped selector. Works, but adds build complexity.
- **Keep emotion for this one thing:** Only use emotion for responsive `style` objects. Minimal
  footprint, but keeps the dependency.
- **Deprecate:** Tell users to use Tailwind responsive classes (`class: 'text-sm lg:text-base'`).
  Cleanest, but breaking change for existing users.

**Recommendation:** Build-time generation for v1. Deprecate in v2 after Tailwind is stable.

---

## The `@layer` Strategy (Resolved)

`StyleProvider layer` wraps antd styles in `@layer antd`, but without a pre-declared layer order
the runtime-injected layer gets appended **after** Tailwind's layers (higher priority = wrong).

**Fix:** Pre-declare order in a generated `globals.css`:

```css
/* Generated by Lowdefy build — replaces styles.less */
@layer theme, base, antd, components, utilities;

/* When Tailwind enabled — granular imports required */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);
```

Priority (lowest → highest): theme → base → **antd** → components → **utilities**

Preflight resets everything → antd restores component styles → Tailwind utilities override
specific properties. Deterministic. No specificity hacks.

**Critical:** Must use Tailwind v4 granular imports, not `@import "tailwindcss"` (which declares
its own layer order internally and conflicts with our explicit declaration).

---

## Recommended Phase Order

1. **Foundation + Block Migration** — antd v6 compiles AND renders correctly (combined)
2. **Slots rename** — engine/client refactor, doesn't touch block component code
3. **Styling architecture** — `class`/`styles` system, remove emotion, touches every block once
4. **Theme system** — YAML theme config → ConfigProvider
5. **Tailwind** — opt-in CSS framework support
6. **New blocks** — FloatButton, Tour, QRCode, etc. (interleave as needed)

---

## Minimal Viable Upgrade (If Scope Must Be Cut)

If time is limited, the absolute minimum to get to antd v6:

1. Upgrade antd + icons + dayjs
2. Remove all .less files, replace `writeStyleImports` with `globals.css` generation
3. Fix all prop renames (`visible`→`open`, etc)
4. Add `StyleProvider layer` + `ConfigProvider` in `_app.js`
5. Replace `import styles.less` with `import globals.css` (with `@layer antd;`)
6. Remove `next-with-less`, `less`, `less-loader` dependencies

This gets antd v6 working with full theming and `@layer` support. Everything else (class property,
slots rename, Tailwind, new blocks, theme YAML config) can come later in separate PRs.

---

## Decisions Resolved

| Decision | Resolution |
|----------|-----------|
| SSR approach | Not needed — client-only rendering |
| `@layer` strategy | Pre-declare in generated `globals.css` |
| `class` union type | String OR object — engine normalizes string to `{ root: value }` |
| Phase ordering | Phase 1+2 combined, slots before styling |
| Multi-library | Separate initiative |
| `_theme` operator | Build-time resolution from YAML config |
| BackTop → FloatButton | Phase 1 (direct replacement) |
| Comment block | Remove entirely (no `@ant-design/compatible`) |

## Decisions Still Open

1. **Responsive styles:** Build-time CSS, keep emotion, or deprecate? (Recommend: build-time)
2. **`style` vs `styles.root`:** Keep separate? (Recommend: yes)
3. **Tailwind v4 + Next.js 13.x:** Needs early testing. Fallback: Tailwind v3.
