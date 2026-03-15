# @lowdefy/layout

CSS custom properties grid-based responsive layout system for Lowdefy blocks.

## Purpose

This package provides:

- `BlockLayout` - Wrapper for individual blocks with responsive sizing
- `Area` - Container for groups of blocks with grid layout

## Key Exports

```javascript
import { Area, BlockLayout } from '@lowdefy/layout';
```

## Architecture

Lowdefy uses a 24-column CSS custom properties grid:

```
┌────────────────────────────────────────────────────────────────────┐
│                          Page (24 cols)                             │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │                       Area (.lf-row)                            │ │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│ │ │ BlockLayout  │ │ BlockLayout  │ │      BlockLayout         │ │ │
│ │ │  (.lf-col)   │ │  (.lf-col)   │ │      (.lf-col)           │ │ │
│ │ │   ┌──────┐   │ │   ┌──────┐   │ │       ┌──────┐           │ │ │
│ │ │   │Block │   │ │   │Block │   │ │       │Block │           │ │ │
│ │ │   └──────┘   │ │   └──────┘   │ │       └──────┘           │ │ │
│ │ └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## BlockLayout Component

Wraps each block with responsive column sizing using CSS custom properties:

```javascript
const BlockLayout = ({ id, children, layout = {}, classNames, styles }) => {
  if (layout.disabled) {
    return <div id={id}>{children}</div>;
  }
  return (
    <div id={id} className="lf-col" style={computeColStyle(layout)}>
      {children}
    </div>
  );
};
```

### Layout Properties

Blocks can specify layout in their config:

```yaml
blocks:
  - id: sidebar
    type: Box
    layout:
      span: 6 # Default span (24-column grid)
      xs: 24 # Extra small screens: full width
      sm: 12 # Small screens: half width
      md: 8 # Medium screens: 1/3 width
      lg: 6 # Large screens: 1/4 width
      xl: 6 # Extra large: 1/4 width
      selfAlign: top # Vertical alignment (top/middle/bottom)
      gap: 16 # Gap between content area children (flows to Area)
      align: middle # Content area vertical alignment (flows to Area)
      justify: center # Content area horizontal distribution (flows to Area)
      direction: row # Content area flex-direction (flows to Area)
      wrap: wrap # Content area flex-wrap (flows to Area)
      overflow: visible # Content area overflow (flows to Area)
```

The `selfAlign` property controls the block's own vertical alignment in its parent row (maps to `align-self`). The `gap`, `align`, `justify`, `direction`, `wrap`, and `overflow` properties flow through `layoutParamsToArea.js` to set defaults for the block's content area.

### Responsive Breakpoints

| Breakpoint | Screen Width | Typical Device   |
| ---------- | ------------ | ---------------- |
| `xs`       | < 640px      | Mobile           |
| `sm`       | >= 640px     | Tablet portrait  |
| `md`       | >= 768px     | Tablet landscape |
| `lg`       | >= 1024px    | Desktop          |
| `xl`       | >= 1280px    | Large desktop    |
| `2xl`      | >= 1536px    | Extra large      |

### Alignment

Vertical self-alignment within a row:

```javascript
const alignSelf = (selfAlign) => {
  if (selfAlign === 'bottom') return 'flex-end';
  if (selfAlign === 'top') return 'flex-start';
  if (selfAlign === 'middle') return 'center';
  return selfAlign;
};
```

## Area Component

Container that creates a flex row for blocks using CSS custom properties:

```javascript
const Area = ({ children, layout }) => (
  <div
    className="lf-row"
    style={{
      '--lf-gap-x': `${layout.gap}px`,
      '--lf-gap-y': `${layout.gap}px`,
      justifyContent: layout.justify,
      alignItems: layout.align,
      flexDirection: layout.direction,
      flexWrap: layout.wrap,
      overflow: layout.overflow,
    }}
  >
    {children}
  </div>
);
```

### Area Layout Properties

```yaml
areas:
  content:
    gap: 16 # Gap between blocks (pixels or [h, v])
    justify: start # Horizontal: start/center/end/space-between/space-around
    align: top # Vertical: top/middle/bottom/stretch
    direction: row # Flex direction
    wrap: wrap # Flex wrap
    overflow: visible # Overflow behavior
    blocks: [...]
```

## grid.css

The grid system is implemented via `grid.css`, which defines the gap-adjusted flex-basis formula:

```
flex-basis = (span / 24) * (100% + gap) - gap
```

This ensures that columns correctly account for gap spacing. CSS custom properties `--lf-gap-x` and `--lf-gap-y` are set on the `.lf-row` container and consumed by `.lf-col` children to calculate their width.

## Design Decisions

### Why CSS Custom Properties Grid?

- No external grid dependency (Ant Design `Row`/`Col` removed)
- Lighter bundle — only CSS, no runtime JS for grid calculations
- Tailwind CSS breakpoint alignment for consistency with utility classes
- Gap-adjusted flex-basis formula handles spacing without padding hacks

### Why 24 Columns?

24 is divisible by 2, 3, 4, 6, 8, 12:

- Half width: 12 cols
- Third width: 8 cols
- Quarter width: 6 cols
- Sixth width: 4 cols

More flexible than 12-column grids.

### Layout Disabled Mode

When `layout.disabled: true`:

- Block renders without grid wrapper
- Useful for full-width content
- Avoids flex interference

## Integration Points

- **@lowdefy/client**: Uses Area and BlockLayout for rendering. Container.js, InputContainer.js etc. pass `classNames.block`/`styles.block` to BlockLayout.
- **@lowdefy/build**: Imports `grid.css` in generated `globals.css`

## Usage in Block Tree

```
Page
└── Area (content)
    ├── BlockLayout
    │   └── Header Block
    ├── BlockLayout
    │   └── Sidebar Block
    │       └── Area (nested)
    │           ├── BlockLayout
    │           │   └── Menu Block
    │           └── BlockLayout
    │               └── Widget Block
    └── BlockLayout
        └── Main Content Block
```

## Example Configurations

### Two-Column Layout

```yaml
blocks:
  - id: sidebar
    type: Box
    layout:
      span: 6
      xs: 24 # Full width on mobile
  - id: content
    type: Box
    layout:
      span: 18
      xs: 24 # Full width on mobile
```

### Three Equal Columns

```yaml
blocks:
  - id: col1
    type: Card
    layout:
      span: 8
  - id: col2
    type: Card
    layout:
      span: 8
  - id: col3
    type: Card
    layout:
      span: 8
```

### Centered Content

```yaml
areas:
  content:
    justify: center
    blocks:
      - id: centered
        type: Box
        layout:
          span: 12 # Half width, centered
```
