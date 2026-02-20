# @lowdefy/layout

Grid-based responsive layout system for Lowdefy blocks. Built on Ant Design's grid.

## Purpose

This package provides:

- `BlockLayout` - Wrapper for individual blocks with responsive sizing
- `Area` - Container for groups of blocks with grid layout

## Key Exports

```javascript
import { Area, BlockLayout } from '@lowdefy/layout';
```

## Architecture

Lowdefy uses a 24-column grid system (from Ant Design):

```
┌────────────────────────────────────────────────────────────────────┐
│                          Page (24 cols)                             │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │                         Area (Row)                              │ │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│ │ │ BlockLayout  │ │ BlockLayout  │ │      BlockLayout         │ │ │
│ │ │   (8 cols)   │ │   (8 cols)   │ │       (8 cols)           │ │ │
│ │ │   ┌──────┐   │ │   ┌──────┐   │ │       ┌──────┐           │ │ │
│ │ │   │Block │   │ │   │Block │   │ │       │Block │           │ │ │
│ │ │   └──────┘   │ │   └──────┘   │ │       └──────┘           │ │ │
│ │ └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## BlockLayout Component

Wraps each block with responsive column sizing:

```javascript
const BlockLayout = ({ id, blockStyle, children, layout = {}, makeCssClass }) => {
  if (layout.disabled) {
    // No grid, just a div
    return <div id={id}>{children}</div>;
  }
  return <Col {...deriveLayout(layout)}>{children}</Col>;
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
      align: top # Vertical alignment (top/middle/bottom)
```

### Responsive Breakpoints

| Breakpoint | Screen Width | Typical Device   |
| ---------- | ------------ | ---------------- |
| `xs`       | < 576px      | Mobile           |
| `sm`       | >= 576px     | Tablet portrait  |
| `md`       | >= 768px     | Tablet landscape |
| `lg`       | >= 992px     | Desktop          |
| `xl`       | >= 1200px    | Large desktop    |
| `xxl`      | >= 1600px    | Extra large      |

### Alignment

Vertical alignment within a row:

```javascript
const alignSelf = (align) => {
  if (align === 'bottom') return 'flex-end';
  if (align === 'top') return 'flex-start';
  if (align === 'middle') return 'center';
  return align;
};
```

## Area Component

Container that creates a flex row for blocks:

```javascript
// Simplified
const Area = ({ children, layout, makeCssClass }) => (
  <Row gutter={layout.gutter} justify={layout.justify} align={layout.align}>
    {children}
  </Row>
);
```

### Area Layout Properties

```yaml
areas:
  content:
    gutter: 16 # Gap between blocks (pixels or [h, v])
    justify: start # Horizontal: start/center/end/space-between/space-around
    align: top # Vertical: top/middle/bottom/stretch
    blocks: [...]
```

## Design Decisions

### Why Ant Design Grid?

- Battle-tested responsive system
- 24-column flexibility
- Built-in breakpoints
- Consistent with Ant Design blocks

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

- **@lowdefy/client**: Uses Area and BlockLayout for rendering
- **@lowdefy/block-utils**: Provides `blockDefaultProps`
- **antd**: Provides Row and Col components

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
