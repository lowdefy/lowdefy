# Critical Review: Antd v6 Upgrade Plan

> Reviewed against: `cc-docs/architecture/antd-v6-upgrade-plan.md`
> Review date: 2026-02-14

---

## Verdict

The plan covers the right territory but has several factual errors, underestimates key risks,
and is vague in the areas that matter most. This review identifies what's wrong, what's missing,
and what needs rethinking before implementation starts.

---

## Section-by-Section Review

### Section 1: Current State Summary — MOSTLY CORRECT

**Key takeaway:** Good reference table. Accurately maps the current pipeline.

**Issue:** The table says "ConfigProvider `theme.token` system" for the target, but the plan later
recommends `zeroRuntime` mode where ConfigProvider's role is reduced to setting CSS variable values.
These are subtly different things — `theme.token` implies the JS-based token system is active.
Clarify: the target is CSS variable overrides with ConfigProvider as the enabler, not as a
runtime style generator.

---

### Section 2.1: Styling System — HAS CRITICAL GAPS

**Key takeaway:** `zeroRuntime` is the right call for Lowdefy. But the plan is naive about what that
actually means in practice.

**Problem 1: `antd/dist/antd.css` is a full bundle — no tree-shaking.**
The plan says "single import" like it's a feature. In reality, this is a ~500KB+ CSS file containing
styles for ALL antd components. For 62 blocks, most of which are used, this is probably acceptable.
But this needs to be stated explicitly — the tradeoff is simplicity vs bundle size.

**Problem 2: `@ant-design/static-style-extract` does NOT generate smaller CSS.**
The plan suggests it for "custom static CSS if we need prefix changes." True for prefix, but the
plan implies it can also generate a subset. It cannot. It renders all components and extracts all
styles. The only benefit is theming/prefix customization, not size reduction.

**Problem 3: `@layer` ordering is NOT automatic in zeroRuntime mode.**
The plan doesn't mention `@layer` at all. In runtime mode, `StyleProvider layer` wraps styles
in `@layer antd` automatically. In `zeroRuntime` mode, `antd.css` does NOT include `@layer`
wrapping — you must manually import with `@import 'antd/dist/antd.css' layer(antd)`. This is
critical for Tailwind coexistence, and the plan completely misses it.

**Problem 4: Component-level token overrides have limitations in `zeroRuntime`.**
The plan's theme YAML shows `components.Button.colorPrimary` overrides. These work by setting
component-level CSS variables (e.g., `--ant-button-default-bg`), which is fine for simple
overrides. But algorithm-derived tokens (color lightening/darkening, hover states) require the
CSS-in-JS runtime for computation. The plan acknowledges algorithm limitations but doesn't address
that even component token overrides that require derivation won't work.

**Action needed:** Add `@layer` strategy to the plan. Document bundle size tradeoff. Clarify
component token limitations. Test which component token overrides actually work in zeroRuntime.

---

### Section 2.2: Prop Renames — CORRECT BUT INCOMPLETE

**Key takeaway:** Good reference table for props that need changing.

**Missing:** The plan doesn't mention that Card's `headStyle`/`bodyStyle` are removed in v6 and
replaced by the `styles` semantic prop. This is listed in Section 3 but should also appear in the
breaking changes table since it's not a rename — it's a removal.

**Missing:** `Drawer.style`/`Drawer.className` semantic change — in v6 these target the panel node,
not the wrapper. The plan mentions this in Section 3 but not in the breaking changes section.

---

### Section 2.3: Removed Components — PARTIALLY WRONG

**Key takeaway:** PageHeaderMenu is flagged as at-risk, but it's actually safe.

**Correction:** The audit confirms `PageHeaderMenu` is a **custom composite** built from Layout,
Header, Menu, Content, Footer, Breadcrumb. It does NOT import antd's `PageHeader`. The plan
incorrectly flags it as "must redesign using antd Layout + custom header or
`@ant-design/pro-components`" — it's already a custom layout and only needs the standard
per-component prop updates (the Drawer `visible` → `open` inside MobileMenu, etc).

**Same for PageSiderMenu** — also custom, not dependent on removed PageHeader.

---

### Section 3: Block Property Updates — INCOMPLETE AUDIT

**Key takeaway:** Lists changes per block but misses several.

**Missing blocks in the audit (from 62 total):**
- Affix, Badge, Pagination, ControlledList, PhoneNumberInput, ParagraphInput, TitleInput,
  ButtonSelector, CheckboxSelector, CheckboxSwitch, RadioSelector, RatingSlider, Switch —
  none of these appear in the per-block changes table.

**Missing: `makeCssClass(..., true)` migration.** 9 blocks use `makeCssClass` with `true` (inline
style mode): Tabs, Descriptions, Drawer (5 style props), Card, Tooltip, Statistic, Menu (5 link
styles), Modal, ConfirmModal. These are converting style objects for antd's internal style props
(`bodyStyle`, `headerStyle`, etc). The plan says "remove makeCssClass usage" but doesn't address
that these conversions serve a purpose — they run `mediaToCssObject` for responsive support on
sub-element styles. If we remove makeCssClass, responsive sub-slot styles break unless we provide
an alternative.

**Missing: `classnames` dependency.** Used by Label and RatingSlider for conditional class merging.
Not a problem to keep, but should be documented. Will likely be more used in the new `class`-based
architecture.

**Missing: Modal actually uses `visible`** (the antd prop, not `properties.visible`). Line 68
of Modal.js passes `visible={openState}` directly to antd's Modal component. This is a concrete
code change, not just a schema update.

---

### Section 4: New Blocks to Add — REASONABLE BUT PRIORITIES ARE DEBATABLE

**Key takeaway:** Good list. Some concerns.

**Concern: Masonry.** Listed as high priority but it's a v6-only component with limited adoption.
Low-code users building dashboards more likely need Descriptions (already exists in blocks!) and
Timeline (exists as TimelineList). Deprioritize Masonry.

**Correction: Descriptions already exists** as a Lowdefy block (block #21 in the audit). The plan
lists it as "medium priority to add" — it's already there.

**Concern: Flex as a block.** Flex is a CSS utility, not really a "block" in the Lowdefy sense.
It's more of a layout option (which the plan itself acknowledges in Section 7.3). Don't double up.

**Missing: Segmented as input.** The plan lists Segmented as display, but it's actually an input
(returns a selected value). Needs to be categorized correctly and have `onChange` event support.

---

### Section 5: Styling Overhaul — THE MOST IMPORTANT SECTION, NEEDS THE MOST WORK

**Key takeaway:** The direction is right (remove emotion, add `class`/`styles`/`classNames`), but
the design has conflicts and under-specified behavior.

**Problem 1: `class` appears twice in the YAML example (Section 5.3).**
The "new" example shows `class: 'shadow-lg'` (string) AND `class:` (object with sub-slots) on
the same block. YAML doesn't allow duplicate keys. This is a design error in the example. Need to
decide: if `class` is a string, it applies to root. If it's an object, sub-slot mapping. Can't
have both on the same block.

**Problem 2: `style` vs `styles` vs `properties.style` — three things, unclear ownership.**
Currently:
- `style` (top-level block key) → layout wrapper via `block.eval.style`
- `properties.style` → used by individual blocks on the antd component itself

The plan says `properties.style` should move to top-level `style`. But these serve different
purposes: `style` controls the layout wrapper (margin, grid positioning), while `properties.style`
controls the component itself (border, background). Merging them loses that distinction.

**Proposal:** Keep `style` for the layout wrapper. Add `styles` for sub-slot component styling.
Deprecate `properties.style` by migrating it to `styles.root`. This preserves the wrapper vs
component distinction.

**Problem 3: Responsive styles have no clear solution.**
The plan says "keep a minimal responsive style helper (not emotion — just generates a `<style>` tag
or uses CSS custom properties)" — this is hand-waving. A `<style>` tag injected per block at
runtime is worse than emotion. CSS custom properties can't express `@media` queries. The real
options are:
1. Keep emotion ONLY for responsive style → `style` objects (not for class generation)
2. Generate a build-time CSS file from responsive style configs
3. Drop responsive style support entirely (push users to Tailwind responsive classes)

Option 3 is cleanest long-term but is a breaking change. Option 2 is the most practical.

**Problem 4: How does `class` flow through the engine?**
The plan says "process `class` in engine (parse operators, resolve to `classNames` object)" but
doesn't detail how. `class` needs to:
1. Be a top-level block key (like `style`, not inside `properties`)
2. Go through the parser (to resolve `_if`, `_state`, etc. operators)
3. Be normalized: string → `{ root: string }`, object → pass through
4. Be passed to both the layout wrapper (`classNames.root` on BlockLayout) and the component
   (`classNames` prop)

This is a new engine concern and needs careful design in Block.js, not just a bullet point.

**Problem 5: Which blocks actually support which classSlots?**
Appendix C lists classSlots per block, but these are assumed based on antd v6 docs. Each must be
verified against the actual antd v6 component API — antd's `classNames` prop shape varies per
component and isn't always documented consistently.

---

### Section 6: Rename `areas` → `slots` — CLEAN, MOSTLY CORRECT

**Key takeaway:** Straightforward rename with good backwards-compat strategy.

**Missing: Full scope of the rename.**
The plan lists 8 locations. The audit found additional:
- `Block.newAreas()` method (line 225 in Block.js)
- `Block.loopSubAreas()` method (line 202)
- `Block.subAreas` property (lines 251, 273-275)
- `List.js` and `InputContainer.js` (both use same pattern as Container.js)
- Multiple references in the build pipeline beyond `moveSubBlocksToArea`

The rename is bigger than the plan suggests. Need a complete grep-based audit.

**Consideration: `subAreas` naming.**
Currently there's `areas` (config) and `subAreas` (runtime instances). With the rename, these
become `slots` and `subSlots`? Or `slots` and `slotInstances`? This naming needs thought.

---

### Section 7: Layout — CORRECTLY SCOPED

**Key takeaway:** Minimal changes, keep Row/Col, good.

**One issue:** The plan says "antd v6 handles grid styles via CSS-in-JS automatically" — but with
`zeroRuntime: true`, grid styles come from `antd.css`, not CSS-in-JS. Minor wording issue but
important for consistency.

**Good call:** Not touching layout heavily. The Row/Col system is stable and doesn't need
disruption during this upgrade.

---

### Section 8: Theme Tokens — APPROACH A IS UNDER-SPECIFIED

**Key takeaway:** Three approaches is good. Approach A (YAML → CSS vars) is the right primary.
But the build-time CSS generation is hand-waved.

**Problem 1: Token name to CSS variable name mapping.**
The plan shows `colorPrimary` → `--ant-color-primary`. The mapping is camelCase to kebab-case with
`--ant-` prefix. This seems straightforward, but antd has ~700 tokens. Component-level tokens
use `--ant-{component}-{token}` (e.g., `--ant-button-default-bg`). Building this mapping correctly
at build time is non-trivial. We either need:
- A token-to-cssvar lookup table extracted from antd's source
- Or runtime ConfigProvider to handle the mapping (but we're trying to avoid runtime)

**Recommendation:** For v1, use ConfigProvider at runtime for token overrides (it still works in
zeroRuntime — it just sets CSS variables). Generate CSS only for simple global overrides. Don't
build our own camelCase→kebab mapper.

**Problem 2: `_theme` operator design.**
The plan proposes `_theme: colorPrimary` to resolve tokens. But tokens are CSS variables in
zeroRuntime mode — they don't have JS-accessible values at runtime unless we also pass the config
to ConfigProvider's `theme.token`. Need to decide: does `_theme` resolve from the YAML config
(build-time), or from the runtime CSS variable value (which would require `getComputedStyle`)?

Build-time resolution from YAML config is simpler and more reliable.

**Problem 3: Approach C (Tailwind bridge) is good but optional.**
Bridging antd CSS vars into Tailwind theme is elegant. But it's not required for v1 —
Tailwind users can just use Tailwind classes directly. Deprioritize.

---

### Section 9: Tailwind & Multi-Library — VISION IS RIGHT, EXECUTION IS VAGUE

**Key takeaway:** Good long-term vision. But mixing this into the antd v6 upgrade is scope creep.

**Problem 1: Tailwind content scanning.**
The plan correctly identifies that Tailwind needs to scan JSON build artifacts for class strings.
But the Lowdefy build writes JSON to `.lowdefy/build/` (not `./build/`), and the class strings
will be inside deeply nested JSON. Tailwind's content scanner uses regex — it will find class-like
strings, but also false positives. Needs testing.

**Problem 2: `componentLibrary` config is premature.**
The plan proposes `componentLibrary: antd | shadcn | radix | custom`. This is a major abstraction
that doesn't need to exist yet. Lowdefy already has the plugin system for this. Users install
`@lowdefy/blocks-antd` or `@lowdefy/blocks-shadcn` as plugins. No need for a new top-level config
key. Keep it simple — plugins already solve this.

**Problem 3: Shadcn blocks are fundamentally different from antd blocks.**
Shadcn uses a composition pattern (you build components from primitives). Antd uses a props-driven
pattern (you configure components with props). These don't map 1:1. A Lowdefy block wrapping a
shadcn component would look very different from one wrapping antd. The "same `meta.category` and
render the same `content`/`slots` contract" claim is optimistic.

**Recommendation:** Remove multi-library from this plan entirely. It's a separate initiative.
Keep Tailwind support (it's CSS-only, no architectural conflict). Move shadcn/radix to a future
plan after the antd v6 upgrade is stable.

---

### Section 10: Implementation Phases — ORDER IS WRONG

**Key takeaway:** 7 phases is too many. Some phases are in the wrong order. Some should be combined.

**Problem 1: Phase 1 and 2 should be one phase.**
You can't "compile and run" antd v6 without also fixing the prop renames. The compiler will
succeed, but nothing will render correctly with `visible` instead of `open`, `moment` instead of
`dayjs`, etc. These aren't separable — you need a working app to validate Phase 1.

**Problem 2: Phase 3 (styling architecture) before Phase 4 (slots rename) is risky.**
Styling touches every block. Slots rename touches the engine and client. Doing styling first means
every block gets touched twice. Better order:
1. Foundation + Block Migration (antd v6 working with all blocks)
2. Slots rename (engine/client, does not touch block code)
3. Styling architecture (touches every block once, with slots already in place)
4. Theme system
5. Tailwind
6. New blocks

**Problem 3: Phase 7 (new blocks) should be interleaved.**
Don't batch all new blocks at the end. Add them as you encounter the need — e.g., FloatButton
replaces BackTop, so add it during Phase 2 when removing BackTop.

---

## Top 10 Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | `antd.css` is ~500KB+ full bundle with no tree-shaking | Medium | Accept for now. Monitor. Extract subset later if needed. |
| 2 | `@layer` not mentioned — Tailwind specificity wars guaranteed | High | Add explicit `@layer` import strategy. Test early. |
| 3 | Responsive `style` has no clear solution post-emotion removal | High | Decide: build-time CSS generation or deprecate in favor of Tailwind. |
| 4 | Component token overrides that need derivation don't work in zeroRuntime | Medium | Document limitations. Use runtime ConfigProvider for complex themes. |
| 5 | 62 blocks need manual testing — no automated visual regression | High | Set up Playwright visual comparison tests before starting. |
| 6 | PageHeaderMenu/PageSiderMenu incorrectly flagged — wastes effort | Low | Corrected in this review. They're custom composites. |
| 7 | `class` + `style` + `styles` is three styling concepts — user confusion | Medium | Clear documentation. Maybe merge `style` into `styles.root`. |
| 8 | Scope creep: multi-library support mixed into antd upgrade | High | Separate concerns. This plan is antd v6 + styling + slots. |
| 9 | `properties.style` → top-level `style` loses wrapper-vs-component distinction | Medium | Keep them separate. Deprecate `properties.style` → `styles.root`. |
| 10 | Build-time token→CSS-var mapping is non-trivial (~700 tokens) | Medium | Use runtime ConfigProvider for v1. Build-time mapping is an optimization. |

---

## Decisions Needed Before Implementation

1. **Responsive styles:** Build-time CSS generation, keep emotion for this one case, or deprecate?
2. **`style` vs `styles.root`:** Merge or keep separate? (Review recommends: keep separate)
3. **Dark mode / algorithms:** Support in v1 or defer?
4. **`antd.css` bundle size:** Acceptable? Or use `static-style-extract` from day one?
5. **Phase ordering:** Combined Phase 1+2, slots before styling?
6. **Multi-library scope:** Include in this plan or separate initiative?
7. **`_theme` operator:** Build-time resolution or runtime?
8. **BackTop → FloatButton:** Add FloatButton in Phase 2 or defer to Phase 7?
9. **Comment block:** Remove entirely or wrap with `@ant-design/compatible`?
10. **Existing Descriptions/TimelineList blocks:** Already exist — deprioritize in new blocks list?
