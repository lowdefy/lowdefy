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

**Use antd v6 default mode, not `zeroRuntime`.**

```jsx
import { StyleProvider } from '@ant-design/cssinjs';
import { AntdRegistry } from '@ant-design/nextjs-registry';

<AntdRegistry>
  <StyleProvider layer>
    <ConfigProvider theme={lowdefy.theme}>
      {children}
    </ConfigProvider>
  </StyleProvider>
</AntdRegistry>
```

**Why:** Default mode gives us tree-shaking (only CSS for used components), full algorithm
support (dark mode from one config line), automatic `@layer antd` wrapping (Tailwind just works),
and complete token derivation. The v6 CSS-in-JS runtime is lightweight — one-time injection per
component type using CSS variables. The v5 performance concerns no longer apply.

---

## Corrected Facts

| Originally Said | Reality |
|-----------------|---------|
| Use `zeroRuntime` with `antd/dist/antd.css` | Use default mode — tree-shaken, full features |
| `@layer` requires manual CSS import ordering | `StyleProvider layer` handles it automatically |
| Algorithms (dark/compact) require special handling | Work out of the box via ConfigProvider |
| Token→CSS-var mapping needs build-time generation | ConfigProvider does it at runtime |
| PageHeaderMenu uses removed PageHeader | Custom composite — no antd PageHeader import |
| Descriptions is a new block to add | Already exists as block #21 |
| `antd.css` is ~500KB+ full bundle | Not relevant — default mode tree-shakes |
| `class` can be string AND object on same block | YAML duplicate key — need union type handling |
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

## The Two Hardest Remaining Problems

### 1. Responsive Styles Without Emotion

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

### 2. `class` Property Design

Need clear semantics for the string-or-object union type:

```yaml
# String → applies to layout wrapper AND component root
class: 'my-card shadow-lg'

# Object → explicit sub-slot mapping
class:
  root: 'my-card shadow-lg'
  header: 'bg-blue-500'
  body: 'p-6'
```

When string: engine normalizes to `{ root: value }`.
When object: passed through directly.

Block components receive a flat `classNames` object — they don't know about the string/object
distinction. The engine normalizes before passing.

**Open question:** Should `class` (string form) apply to the layout wrapper div, the component
root, or both? The wrapper and the component are different DOM elements.

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
2. Remove all .less files, remove `buildStyleImports`/`writeStyleImports`
3. Fix all prop renames (`visible`→`open`, etc)
4. Add `StyleProvider layer` + `ConfigProvider` + `AntdRegistry` at app root
5. Remove `next-with-less` from server configs
6. Remove `less`, `less-loader` dependencies

This gets antd v6 working with full theming and `@layer` support. Everything else (class property,
slots rename, Tailwind, new blocks, theme YAML config) can come later in separate PRs.

---

## Decisions Needed Before Implementation

1. **Responsive styles:** Build-time CSS generation, keep emotion, or deprecate?
2. **`style` vs `styles.root`:** Keep separate? (Recommended: yes)
3. **Phase ordering:** Combined Phase 1+2, slots before styling? (Recommended: yes)
4. **Multi-library scope:** Separate initiative? (Recommended: yes)
5. **BackTop → FloatButton:** Phase 1 or later?
6. **Comment block:** Remove or wrap?
7. **SSR:** Verify `@ant-design/nextjs-registry` with Pages Router
8. **`class` string form:** Apply to wrapper, component, or both?
