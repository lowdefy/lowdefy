# Antd v6 Migration Codemod

Migrate a Lowdefy app from Lowdefy v4.x (antd v4) to Lowdefy v5.x (antd v6).

## Usage

Run this in the root of your Lowdefy app directory.

## Workflow

### Step 1: Pre-flight Check

Verify the app is a Lowdefy project:

```bash
ls lowdefy.yaml 2>/dev/null || ls lowdefy.yml 2>/dev/null
```

If not found: "This doesn't appear to be a Lowdefy app directory. Run from the root of your Lowdefy project."

Check for uncommitted changes:

```bash
git status --porcelain
```

If changes exist, warn: "Uncommitted changes detected. Commit or stash before running migration."

### Step 2: Run Automated Scripts (Category A)

Run each script in order. Present results to the user after each.

#### 2.1: Rename `areas` → `slots`

```bash
node v5.0/scripts/01-rename-areas-to-slots.mjs --apply .
```

All `areas:` keys on blocks become `slots:`. Both are supported during the deprecation period, but `slots` is the canonical name going forward.

#### 2.2: Move `properties.style` → `style: { --element }`

```bash
node v5.0/scripts/02-migrate-properties-style.mjs --apply .
```

The `properties.style` key (component element styling) moves to the new `style: { --element: { ... } }` slot. This is automatically handled at build time with a deprecation warning, but migrating now is cleaner.

#### 2.3: Move inline style props to `style: { --* }` sub-slots

```bash
node v5.0/scripts/03-migrate-inline-style-props.mjs --apply .
```

**REQUIRED:** This script reports locations but the actual move from `properties:` to `style: { --* }` requires manual verification. For each reported file, check the context and apply the move. The mapping is:

| Block        | Old Property                     | New Location           |
| ------------ | -------------------------------- | ---------------------- |
| Card         | `properties.headerStyle`         | `style: { --header }`  |
| Card         | `properties.bodyStyle`           | `style: { --body }`    |
| Modal        | `properties.bodyStyle`           | `style: { --body }`    |
| Modal        | `properties.maskStyle`           | `style: { --mask }`    |
| Drawer       | `properties.drawerStyle`         | `style: { --wrapper }` |
| Drawer       | `properties.headerStyle`         | `style: { --header }`  |
| Drawer       | `properties.bodyStyle`           | `style: { --body }`    |
| Drawer       | `properties.maskStyle`           | `style: { --mask }`    |
| Drawer       | `properties.contentWrapperStyle` | `style: { --content }` |
| Tabs         | `properties.tabBarStyle`         | `style: { --tabBar }`  |
| ConfirmModal | `properties.bodyStyle`           | `style: { --body }`    |
| Statistic    | `properties.valueStyle`          | `style: { --value }`   |
| Descriptions | `properties.contentStyle`        | `style: { --content }` |
| Descriptions | `properties.labelStyle`          | `style: { --label }`   |
| Tooltip      | `properties.overlayStyle`        | `style: { --inner }`   |

#### 2.4: Convert `bordered` → `variant`

```bash
node v5.0/scripts/04-bordered-to-variant.mjs --apply .
```

`bordered: false` becomes `variant: borderless`. `bordered: true` is removed (it's the default). Affects 16 blocks including all input types, Card, Collapse, and Descriptions.

#### 2.5: Simple property and event renames

```bash
node v5.0/scripts/05-simple-prop-renames.mjs --apply .
```

Renames:

- Modal: `visible` → `open`
- Tooltip: `defaultVisible` → `defaultOpen`
- Tooltip: `onVisibleChange` → `onOpenChange` (event)
- Progress: `gapPosition` → `gapPlacement`
- Carousel: `dotPosition` → `dotPlacement`
- Collapse: `expandIconPosition` → `expandIconPlacement`

#### 2.6: Tabs position → placement

```bash
node v5.0/scripts/06-tabs-position-to-placement.mjs --apply .
```

`tabPosition` → `tabPlacement` with value mapping: `left` → `start`, `right` → `end`. Top and bottom are unchanged.

#### 2.7: Notification `message` → `title`

```bash
node v5.0/scripts/07-notification-message-to-title.mjs --apply .
```

Context-aware: only renames `message` to `title` inside Notification block properties.

### Step 3: Run Semi-Automated Scripts (Category B)

Run each script and review the flagged items.

#### 3.1: Divider dual rename

```bash
node v5.0/scripts/08-divider-dual-rename.mjs --apply .
```

**REQUIRED:** Review the "REVIEW NEEDED" output. This is a dual swap where both `type` and `orientation` change meaning:

- `type: horizontal` → `orientation: horizontal` (was direction, still direction)
- `orientation: left` → `titlePlacement: start` (was text position, now renamed + value mapped)

For each flagged Divider, verify the transformation is correct.

#### 3.2: Button type/danger → color + variant

```bash
node v5.0/scripts/09-button-type-to-color-variant.mjs --apply .
```

**REQUIRED:** Review the "REVIEW NEEDED" output. Buttons with expression-based `type` values need manual mapping. The static mapping is:

- `type: primary` → `color: primary, variant: solid`
- `type: dashed` → `variant: dashed`
- `type: text` → `variant: text`
- `type: link` → `variant: link`
- `danger: true` → `color: danger`

#### 3.3: Detect styles.less

```bash
node v5.0/scripts/10-detect-styles-less.mjs --apply .
```

If `public/styles.less` exists, the script maps known Less variables to antd token names and prints the equivalent `theme.antd.token` YAML block. Help the user add this to their `lowdefy.yaml`.

For complex Less (mixins, nesting, expressions), guide the user to convert to plain CSS in `public/styles.css`.

#### 3.4: Migrate meta.styles in custom block plugins

```bash
node v5.0/scripts/12-migrate-meta-styles.mjs --apply .
```

**REQUIRED:** Review the output carefully. This script handles custom block plugins that use the old `meta.styles` mechanism:

1. **Removes `meta.styles`** from block component files
2. **Removes `styles` aggregation and export** from `types.js` files
3. **Deletes dead `.less` files** that are pure antd re-imports
4. **Converts plain `.less` → `.css`** with `@layer components { }` wrapper
5. **Adds direct `import './style.css'`** to block component files

Files with Less-specific syntax (variables, functions, mixins) are **skipped** — convert those manually to CSS first, then re-run.

After applying, review the generated CSS imports in block files to ensure the relative paths are correct. Delete `.less.deleted` files after verification.

#### 3.5: Detect date format strings

```bash
node v5.0/scripts/11-detect-date-formats.mjs .
```

Reports custom date format strings on date blocks. Standard formats work identically in dayjs. For flagged custom formats, advise the user to test them — most moment format tokens are compatible, but edge cases exist with locale-specific tokens.

### Step 4: AI-Guided Migrations (Category C)

#### 4.1: Responsive style breakpoints

Search for responsive breakpoint keys in style objects:

```bash
grep -rn 'sm:\|md:\|lg:\|xl:\|xs:\|2xl:' . --include='*.yaml' --include='*.yml' | grep -v node_modules | grep -v .codemod-backup
```

If matches found, read each file and check if the breakpoint keys are inside a `style:` block on a Lowdefy block. For each match:

1. Read the surrounding context to understand the responsive intent
2. Suggest equivalent Tailwind utility classes using the `class` property
3. Common mappings:
   - `padding: 64` + `sm: { padding: 32 }` → `class: "p-16 sm:p-8"`
   - `display: none` + `md: { display: block }` → `class: "hidden md:block"`
   - `fontSize: 24` + `sm: { fontSize: 16 }` → `class: "text-2xl sm:text-base"`
4. Apply the change with user approval
5. Remove the responsive keys from `style`

Note: `layout.sm.span` (antd Col responsive) is NOT affected — only `style.sm.*` breakpoints are removed.

#### 4.2: Comment block removal

Search for Comment blocks:

```bash
grep -rn 'type: Comment' . --include='*.yaml' --include='*.yml' | grep -v node_modules
```

If matches found, the Comment block is removed in this version (antd removed the Comment component). For each match:

1. Read the full block and its context
2. Suggest a replacement using available blocks (Card, Flex, Avatar, Paragraph, Title)
3. Preserve the same visual layout and data bindings
4. Apply the replacement with user approval

Example replacement:

```yaml
# Before
- id: comment1
  type: Comment
  properties:
    author: 'User Name'
    content: 'This is a comment'
    avatar: '/avatar.png'

# After
- id: comment1
  type: Flex
  properties:
    gap: 12
    align: start
  blocks:
    - id: comment1_avatar
      type: Avatar
      properties:
        src: '/avatar.png'
    - id: comment1_content
      type: Flex
      properties:
        vertical: true
        gap: 4
      blocks:
        - id: comment1_author
          type: Title
          properties:
            level: 5
            content: 'User Name'
        - id: comment1_text
          type: Paragraph
          properties:
            content: 'This is a comment'
```

### Step 5: Migration Report

After all steps, generate a summary:

- Total files modified
- Automated changes applied (count per script)
- Semi-automated changes applied + items reviewed
- AI-guided changes applied
- Any items that still need manual attention

"Migration complete. Review changes with `git diff` and test your app."
