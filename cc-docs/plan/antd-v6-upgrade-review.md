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

**Key takeaway:** Default mode with `StyleProvider layer` + `AntdRegistry` for SSR is the right
architecture. Code example is clear.

**Minor:** Verify `@ant-design/nextjs-registry` compatibility with Next.js 13.5.4. The registry
package targets Next.js App Router — confirm it also works with Pages Router (which Lowdefy uses).
If not, the alternative is manual SSR extraction via `@ant-design/cssinjs` `extractStyle()`.

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

## Updated Top 10 Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Responsive `style` has no clear solution post-emotion removal | **High** | Decide: build-time CSS generation or deprecate in favor of Tailwind |
| 2 | 62 blocks need manual testing — no automated visual regression | **High** | Set up Playwright visual comparison tests before starting |
| 3 | Scope creep: multi-library support mixed into antd upgrade | **High** | Separate concerns. This plan is antd v6 + styling + slots |
| 4 | `class` + `style` + `styles` is three styling concepts — user confusion | **Medium** | Clear documentation. Deprecate `properties.style` → `styles.root` |
| 5 | `properties.style` → top-level `style` loses wrapper vs component distinction | **Medium** | Keep separate. Deprecate `properties.style` → `styles.root` |
| 6 | PageHeaderMenu/PageSiderMenu incorrectly flagged — wastes effort | **Low** | Corrected in this review. They're custom composites |
| 7 | `@ant-design/nextjs-registry` may not support Pages Router (Next 13) | **Medium** | Test early. Fallback: manual `extractStyle()` SSR setup |
| 8 | `class` YAML example has duplicate key bug | **Low** | Fix example to show union type (string OR object, not both) |
| 9 | ~15 blocks missing from audit — risk of surprises during migration | **Medium** | Complete block audit before starting Phase 1 |
| 10 | Segmented miscategorized as display (it's input) | **Low** | Fix in new blocks list |

**Notable:** 3 risks from Rev 1 are completely eliminated by switching to default mode (bundle
size, `@layer` ordering, token derivation).

---

## Decisions Needed Before Implementation

~~1. Dark mode / algorithms: Support in v1 or defer?~~ **Resolved** — works out of the box now.
~~2. `antd.css` bundle size: Acceptable?~~ **Resolved** — tree-shaken, not a concern.
~~3. Build-time token→CSS-var mapping?~~ **Resolved** — ConfigProvider handles it at runtime.

**Remaining decisions:**

1. **Responsive styles:** Build-time CSS generation, keep emotion for this one case, or deprecate?
2. **`style` vs `styles.root`:** Merge or keep separate? (Review recommends: keep separate)
3. **Phase ordering:** Combined Phase 1+2, slots before styling?
4. **Multi-library scope:** Include in this plan or separate initiative?
5. **`_theme` operator:** Build-time resolution from YAML config? (Review recommends: yes)
6. **BackTop → FloatButton:** Add FloatButton in Phase 1+2 or defer?
7. **Comment block:** Remove entirely or wrap with `@ant-design/compatible`?
8. **SSR approach:** `@ant-design/nextjs-registry` or manual `extractStyle()`?
9. **`class` property:** String-or-object union type — how to document clearly?
