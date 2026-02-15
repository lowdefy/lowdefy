# Critical Review: Antd v6 Upgrade Plan (Rev 2)

> Reviewed against: `cc-docs/architecture/antd-v6-upgrade-plan.md` (updated)
> Review date: 2026-02-15

---

## Verdict

The plan has been significantly improved by switching from `zeroRuntime` to antd v6's default
CSS-in-JS mode with `StyleProvider layer`. This resolves the three biggest issues from Rev 1
(`@layer` automation, algorithm support, tree-shaking). The remaining concerns are around styling
architecture details, phase ordering, and scope boundaries.

---

## Resolved Issues (From Rev 1)

These were critical in the first review and are now fixed:

| Issue | Status |
|-------|--------|
| `@layer` not mentioned — Tailwind specificity wars | **Resolved** — `StyleProvider layer` handles this automatically |
| ~500KB full CSS bundle with no tree-shaking | **Resolved** — default mode only injects CSS for rendered components |
| Dark mode / algorithms broken in zeroRuntime | **Resolved** — full algorithm support with default mode |
| Component token derivation doesn't work | **Resolved** — full ConfigProvider token system active |
| Manual CSS import ordering fragility | **Resolved** — runtime injection with automatic `@layer` wrapping |
| `@ant-design/static-style-extract` misrepresented | **Resolved** — no longer needed at all |
| Build-time token→CSS-var mapping is non-trivial | **Resolved** — ConfigProvider maps tokens to CSS vars at runtime |

---

## Remaining Issues

### Section 1: Current State Summary — CORRECT

**Key takeaway:** Table now accurately reflects the default CSS-in-JS approach with `StyleProvider`.
No issues.

---

### Section 2.1: Styling System — NOW CORRECT

**Key takeaway:** Default mode with `StyleProvider layer` + `ConfigProvider` is the right
architecture. No SSR style extraction needed — Lowdefy renders client-side only.

**Resolved:** `@ant-design/nextjs-registry` is App Router only and NOT needed. Lowdefy's `_app.js`
uses `dynamic(..., { ssr: false })`, so there's no server-side rendering of antd components. The
CSS-in-JS engine injects styles client-side, which is exactly how Lowdefy already works.

**New Section 2.1.1** (`@layer` strategy) correctly addresses the Tailwind coexistence issue that
was the #1 risk in Rev 1. Pre-declaring `@layer theme, base, antd, components, utilities` in a
generated `globals.css` locks the cascade priority. Critical detail: must use Tailwind v4 granular
imports (not `@import "tailwindcss"`) to control layer placement.

**New concern:** Tailwind v4 compatibility with Next.js 13.x is untested. Tailwind v4 is
officially documented with Next.js 14/15. If it doesn't work with 13.x, fallback is Tailwind v3
(which does NOT use native CSS `@layer` and needs a different coexistence strategy).

---

### Section 2.2: Prop Renames — CORRECT BUT INCOMPLETE

Same as Rev 1 — Card `headStyle`/`bodyStyle` removal and Drawer semantic changes should also
appear in the breaking changes table, not just Section 3.

---

### Section 2.3: Removed Components — PARTIALLY WRONG (UNCHANGED)

Same as Rev 1 — PageHeaderMenu/PageSiderMenu are custom composites, not dependent on removed
PageHeader.

---

### Section 3: Block Property Updates — INCOMPLETE AUDIT (UNCHANGED)

Same as Rev 1:
- ~15 blocks missing from the per-block table
- 9 blocks use `makeCssClass(..., true)` for inline styles — migration path unclear
- Modal.js line 68 directly passes `visible` to antd component
- `classnames` dependency not documented

---

### Section 4: New Blocks — REASONABLE (UNCHANGED)

Same as Rev 1:
- Descriptions already exists
- Segmented should be categorized as input
- Masonry should be deprioritized
- Flex is a layout option, not a block

---

### Section 5: Styling Overhaul — STILL NEEDS THE MOST WORK

Same as Rev 1 — these are design problems, not zeroRuntime-related:

**Problem 1: Duplicate `class` key in YAML example.** Still present. YAML can't have two `class`
keys on the same mapping.

**Problem 2: `style` vs `styles` vs `properties.style` ownership.** Still unclear. Recommendation
stands: keep `style` for wrapper, add `styles` for sub-slots, deprecate `properties.style` →
`styles.root`.

**Problem 3: Responsive styles.** Still the hardest open question. Now that we're keeping the
CSS-in-JS runtime, there's an additional option:

4. Use antd's `useToken()` hook with CSS-in-JS for responsive styles

But this couples blocks to antd's runtime even more. The cleanest options remain:
- **Build-time CSS generation** for `style` objects with responsive keys
- **Deprecate responsive `style`** and push to Tailwind responsive classes

**Problem 4: `class` engine flow.** Still under-specified.

**Problem 5: classSlots verification.** Still needed against actual antd v6 API.

---

### Section 6: Rename `areas` → `slots` — CLEAN (UNCHANGED)

Same as Rev 1 — scope is bigger than listed, `subAreas` naming needs thought.

---

### Section 7: Layout — CORRECT

Wording is now consistent with the default CSS-in-JS approach.

---

### Section 8: Theme Tokens — SIGNIFICANTLY IMPROVED

The switch to default mode simplifies this section enormously. ConfigProvider handles all token
resolution, including:
- Seed → Map token derivation (full color palettes)
- Algorithm support (dark, compact, combined)
- Component-level overrides with derivation
- Automatic CSS variable generation

**Remaining concern: `_theme` operator.**
Now that ConfigProvider runs at runtime, tokens are accessible via `theme.useToken()` in React
components. But Lowdefy operators run in the parser, not in React. The `_theme` operator still
needs to resolve from the YAML config at build/parse time.

**Simple approach:** `_theme: colorPrimary` resolves to the literal value from `lowdefy.yaml`
theme config. This is a build-time lookup, not a runtime hook. Works because the user's theme
config is available during parsing. Won't reflect runtime theme changes (e.g., dark mode toggle),
but that's an edge case for later.

---

### Section 9: Tailwind & Multi-Library — SCOPE CONCERN (UNCHANGED)

Same as Rev 1 — multi-library should be separated. Tailwind integration is simpler now that
`StyleProvider layer` handles `@layer` automatically.

---

### Section 10: Implementation Phases — ORDER CONCERN (UNCHANGED)

Same as Rev 1:
- Phase 1+2 should be combined
- Slots before styling
- New blocks interleaved

---

## Updated Top 10 Risks (Rev 3)

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | Responsive `style` has no clear solution post-emotion removal | **High** | **OPEN** — last remaining decision |
| 2 | 62 blocks need manual testing — no automated visual regression | **High** | **OPEN** — need Playwright setup |
| 3 | ~~Scope creep: multi-library support~~ | ~~High~~ | **Resolved** — separated from this plan |
| 4 | `class` + `style` + `styles` is three styling concepts — user confusion | **Medium** | **OPEN** — clear docs needed |
| 5 | `properties.style` → `styles.root` distinction | **Medium** | **OPEN** — recommend keep separate |
| 6 | ~~PageHeaderMenu/PageSiderMenu incorrectly flagged~~ | ~~Low~~ | **Resolved** — custom composites |
| 7 | ~~`@ant-design/nextjs-registry` Pages Router~~ | ~~Medium~~ | **Resolved** — not needed, client-only rendering |
| 8 | ~~`class` YAML example duplicate key~~ | ~~Low~~ | **Resolved** — fixed to show union type |
| 9 | ~15 blocks missing from audit | **Medium** | **OPEN** — complete audit before Phase 1 |
| 10 | ~~Segmented miscategorized~~ | ~~Low~~ | Note for new blocks list |
| 11 | `@layer` pre-declaration required for Tailwind coexistence | **High** | **Resolved** — plan updated with globals.css strategy |
| 12 | Tailwind v4 compatibility with Next.js 13.x | **Medium** | **OPEN** — needs early testing, may need v3 fallback |

**Active risks:** 1, 2, 4, 5, 9, 12. Everything else resolved.

---

## Decisions Needed Before Implementation

~~1. Dark mode / algorithms: Support in v1 or defer?~~ **Resolved** — works out of the box now.
~~2. `antd.css` bundle size: Acceptable?~~ **Resolved** — tree-shaken, not a concern.
~~3. Build-time token→CSS-var mapping?~~ **Resolved** — ConfigProvider handles it at runtime.
~~4. SSR approach: `@ant-design/nextjs-registry` or manual `extractStyle()`?~~ **Resolved** —
Neither. Lowdefy renders client-side only (`_app.js` uses `dynamic(..., { ssr: false })`). No SSR
style extraction needed. Just `StyleProvider layer` + `ConfigProvider` in the App component.
~~5. `@layer` strategy for Tailwind?~~ **Resolved** — Pre-declare layer order in generated
`globals.css`: `@layer theme, base, antd, components, utilities;`. Use Tailwind v4 granular
imports. `StyleProvider layer` handles antd side. See plan Section 2.1.1.
~~6. `class` property: String-or-object union type?~~ **Resolved** — Union type (string OR object).
String normalizes to `{ root: value }` in the engine. Plan example fixed to show two separate
blocks instead of duplicate keys.
~~7. Phase ordering: Combined Phase 1+2, slots before styling?~~ **Resolved** — Yes. Phase 1+2
combined (can't validate antd v6 without prop fixes). Slots before styling (avoids touching
blocks twice).
~~8. Multi-library scope: Include in this plan or separate initiative?~~ **Resolved** — Separate
initiative. This plan is antd v6 + styling + slots + Tailwind. Multi-library comes after.
~~9. `_theme` operator: Build-time resolution?~~ **Resolved** — Yes, resolves from YAML config at
parse time. Simple lookup: `_theme: colorPrimary` → value from `lowdefy.yaml` theme.token.
~~10. BackTop → FloatButton?~~ **Resolved** — Add FloatButton during Phase 1 when removing BackTop.
Don't defer — it's the direct replacement.
~~11. Comment block?~~ **Resolved** — Remove entirely. Don't add `@ant-design/compatible` as a
dependency for one rarely-used block. Users who need it can use a custom plugin.

**Remaining decisions:**

1. **Responsive styles:** Build-time CSS generation, keep emotion for this one case, or deprecate?
2. **`style` vs `styles.root`:** Merge or keep separate? (Review recommends: keep separate)
