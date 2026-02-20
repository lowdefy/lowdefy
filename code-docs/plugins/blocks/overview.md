# Blocks Plugin Overview

Blocks are the visual building blocks of Lowdefy applications. Each block is a React component that renders UI elements.

## What Are Blocks?

Blocks are:

- React components wrapped for Lowdefy
- Configurable via YAML properties
- Connected to page state
- Event-driven (onClick, onChange, etc.)

## Block Categories

| Category       | Purpose             | Examples                         |
| -------------- | ------------------- | -------------------------------- |
| **Container**  | Layout and grouping | Box, Card, Collapse, Tabs        |
| **Input**      | User data entry     | TextInput, NumberInput, Selector |
| **Display**    | Show data           | Title, Paragraph, Table, List    |
| **Feedback**   | User feedback       | Alert, Message, Progress         |
| **Navigation** | App navigation      | Menu, Breadcrumb, Anchor         |

## Available Block Packages

| Package                                                 | Description                 | Block Count |
| ------------------------------------------------------- | --------------------------- | ----------- |
| [@lowdefy/blocks-antd](./antd.md)                       | Primary UI kit (Ant Design) | 62          |
| [@lowdefy/blocks-basic](./basic.md)                     | HTML primitives             | 8           |
| [@lowdefy/blocks-aggrid](./aggrid.md)                   | AG Grid data tables         | 1           |
| [@lowdefy/blocks-echarts](./echarts.md)                 | ECharts visualizations      | 1           |
| [@lowdefy/blocks-markdown](./markdown.md)               | Markdown rendering          | 2           |
| [@lowdefy/blocks-google-maps](./google-maps.md)         | Google Maps                 | 1           |
| [@lowdefy/blocks-algolia](./algolia.md)                 | Algolia search              | 1           |
| [@lowdefy/blocks-color-selectors](./color-selectors.md) | Color pickers               | 3           |
| [@lowdefy/blocks-loaders](./loaders.md)                 | Loading spinners            | 1           |
| [@lowdefy/blocks-qr](./qr.md)                           | QR code generation          | 1           |

## Block Structure

Each block package exports:

```javascript
export default {
  // Block type definitions
  types: {
    Button: { meta: { category: 'input', ... } },
    Card: { meta: { category: 'container', ... } },
    // ...
  }
};
```

## Block Configuration

Blocks are configured in YAML:

```yaml
blocks:
  - id: submitButton
    type: Button
    properties:
      title: Submit
      type: primary
      icon: AiOutlineSend
    events:
      onClick:
        - id: submitForm
          type: Request
          params:
            requestId: saveData
```

## Block Properties

Each block has:

- **id** - Unique identifier
- **type** - Block type name
- **properties** - Configuration (title, style, etc.)
- **events** - Event handlers (onClick, onChange)
- **areas** - Child block containers
- **layout** - Grid positioning
- **visible** - Conditional visibility
- **loading** - Loading skeleton

## Block Lifecycle

```
1. Build time
   └── Block config validated against schema

2. Page load
   └── Block component loaded (code split)
   └── Block registered in Areas

3. Render
   └── Properties evaluated (operators resolved)
   └── Component rendered
   └── Events attached

4. Interaction
   └── User triggers event
   └── Actions executed
   └── State updates
   └── Re-render with new properties
```

## Design Decisions

### Why Ant Design as Default?

- Comprehensive component library (60+ components)
- Professional enterprise-ready design
- Active maintenance and community
- Consistent design language
- Good accessibility support

### Why Separate Block Packages?

- Code splitting: only load what's used
- Optional dependencies: AG Grid, ECharts are large
- Plugin flexibility: easy to add new libraries
- Version independence: update separately

### Block Meta Categories

Blocks declare their category for:

- Build validation (inputs need value handling)
- Documentation organization
- IDE tooling support

Categories: `container`, `input`, `display`, `list`, `context`
