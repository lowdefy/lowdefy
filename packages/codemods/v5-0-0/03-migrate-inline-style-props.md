# Migration: Move Block-Specific Style Properties to `style: { /* }` Sub-Slots

## Context

Several blocks had dedicated style properties under `properties:` (like `headerStyle`, `bodyStyle`, `maskStyle`). These move to the unified `style:` block with `/`-prefixed slot keys.

## What to Do

For each block, find the old style property under `properties:` and move its value to the corresponding `style: { /slot }` entry. Remove the old property from `properties:`.

**Full mapping table:**

| Block        | Old Property                     | New Location          |
| ------------ | -------------------------------- | --------------------- |
| Card         | `properties.headerStyle`         | `style: { /header }`  |
| Card         | `properties.bodyStyle`           | `style: { /body }`    |
| Modal        | `properties.bodyStyle`           | `style: { /body }`    |
| Modal        | `properties.maskStyle`           | `style: { /mask }`    |
| Drawer       | `properties.drawerStyle`         | `style: { /wrapper }` |
| Drawer       | `properties.headerStyle`         | `style: { /header }`  |
| Drawer       | `properties.bodyStyle`           | `style: { /body }`    |
| Drawer       | `properties.maskStyle`           | `style: { /mask }`    |
| Drawer       | `properties.contentWrapperStyle` | `style: { /content }` |
| Tabs         | `properties.tabBarStyle`         | `style: { /tabBar }`  |
| ConfirmModal | `properties.bodyStyle`           | `style: { /body }`    |
| Statistic    | `properties.valueStyle`          | `style: { /value }`   |
| Descriptions | `properties.contentStyle`        | `style: { /content }` |
| Descriptions | `properties.labelStyle`          | `style: { /label }`   |
| Tooltip      | `properties.overlayStyle`        | `style: { /inner }`   |

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `headerStyle:|bodyStyle:|maskStyle:|drawerStyle:|contentWrapperStyle:|tabBarStyle:|valueStyle:|contentStyle:|labelStyle:|overlayStyle:`

## Examples

### Before

```yaml
- id: my_card
  type: Card
  properties:
    title: Details
    headerStyle:
      backgroundColor: '#fafafa'
    bodyStyle:
      padding: 24
```

### After

```yaml
- id: my_card
  type: Card
  properties:
    title: Details
  style:
    /header:
      backgroundColor: '#fafafa'
    /body:
      padding: 24
```

### Before — Drawer with multiple style props

```yaml
- id: settings_drawer
  type: Drawer
  properties:
    title: Settings
    drawerStyle:
      backgroundColor: '#f5f5f5'
    headerStyle:
      borderBottom: '1px solid #e8e8e8'
    bodyStyle:
      padding: 16
```

### After

```yaml
- id: settings_drawer
  type: Drawer
  properties:
    title: Settings
  style:
    /wrapper:
      backgroundColor: '#f5f5f5'
    /header:
      borderBottom: '1px solid #e8e8e8'
    /body:
      padding: 16
```

## Edge Cases

- If the block already has a top-level `style:` block, merge the new `/slot` entries into it
- If a block already has `style: { /element }` from prompt 02, add the new slots alongside it
- These property names are unique to their respective blocks — `headerStyle` only appears on Card and Drawer, so block-type checking is optional but recommended for safety
- Operator expressions inside style values should be moved as-is

## Verification

```
grep -rn 'headerStyle:\|bodyStyle:\|maskStyle:\|drawerStyle:\|contentWrapperStyle:\|tabBarStyle:\|valueStyle:\|contentStyle:\|labelStyle:\|overlayStyle:' --include='*.yaml' --include='*.yml' .
```

No matches should remain after migration (except inside code blocks or string content).
