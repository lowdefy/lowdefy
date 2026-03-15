# Comment Block Removal

## What Changed

The `Comment` block type has been removed. Antd v6 removed the Comment component. Replace with a composition of `Flex`, `Avatar`, `Title`, and `Paragraph` blocks.

## How to Migrate

### 1. Find Comment blocks

```bash
grep -rn 'type: Comment' . --include='*.yaml' --include='*.yml' | grep -v node_modules
```

### 2. Replace each Comment block

#### Before

```yaml
- id: comment1
  type: Comment
  properties:
    author: 'User Name'
    content: 'This is a comment'
    avatar: '/avatar.png'
    datetime: '2024-01-15'
```

#### After

```yaml
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
        size: 32
    - id: comment1_body
      type: Flex
      properties:
        vertical: true
        gap: 4
      blocks:
        - id: comment1_header
          type: Flex
          properties:
            gap: 8
            align: center
          blocks:
            - id: comment1_author
              type: Title
              properties:
                level: 5
                content: 'User Name'
            - id: comment1_date
              type: Paragraph
              properties:
                type: secondary
                content: '2024-01-15'
        - id: comment1_text
          type: Paragraph
          properties:
            content: 'This is a comment'
```

### Property Mapping

| Comment Property | Replacement                               |
| ---------------- | ----------------------------------------- |
| `author`         | `Title` block with `level: 5`             |
| `content`        | `Paragraph` block                         |
| `avatar`         | `Avatar` block with `src` property        |
| `datetime`       | `Paragraph` block with `type: secondary`  |
| `actions`        | Additional action blocks (buttons, links) |

### Notes

- Preserve all data bindings (`_state`, `_request`, etc.) when migrating properties
- If the Comment had `actions`, add them as button blocks in the body Flex
- Adjust spacing (`gap`) to match your design

### Checklist

- [ ] Find all `type: Comment` blocks
- [ ] Replace each with Flex + Avatar + Title + Paragraph composition
- [ ] Preserve all data bindings and event handlers
- [ ] Migrate any `actions` to button blocks
- [ ] Verify visual equivalence in the browser
