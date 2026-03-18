# Migration: Replace Comment Blocks

## Context

The Comment component was removed from antd v6. Lowdefy blocks that use `type: Comment` must be replaced with equivalent compositions using available blocks (Card, Flex, Avatar, Title, Paragraph, Button).

## What to Do

For each Comment block:

1. Read the full block and understand what it displays (author, avatar, content, actions, datetime, nested comments)
2. Build an equivalent layout using available blocks
3. Preserve all data bindings, event handlers, and operator expressions

There is no 1:1 mapping — each replacement depends on how the Comment was used.

### Replacement Pattern

The typical Comment block maps to a horizontal Flex (avatar + content column):

```yaml
# Comment equivalent
- id: {comment_id}
  type: Flex
  properties:
    gap: 12
    align: start
  slots:
    content:
      blocks:
        - id: {comment_id}_avatar
          type: Avatar
          properties:
            src: {avatar_value}
            size: 32
        - id: {comment_id}_body
          type: Flex
          properties:
            vertical: true
            gap: 4
          slots:
            content:
              blocks:
                - id: {comment_id}_header
                  type: Flex
                  properties:
                    gap: 8
                    align: center
                  slots:
                    content:
                      blocks:
                        - id: {comment_id}_author
                          type: Title
                          properties:
                            level: 5
                            content: {author_value}
                        - id: {comment_id}_time
                          type: Paragraph
                          properties:
                            content: {datetime_value}
                            type: secondary
                - id: {comment_id}_text
                  type: Paragraph
                  properties:
                    content: {content_value}
```

## Files to Check

Glob: `**/*.{yaml,yml}`
Grep: `type: Comment`

## Examples

### Before — simple comment

```yaml
- id: user_comment
  type: Comment
  properties:
    author: John Doe
    content: This looks great!
    avatar: /images/john.png
```

### After

```yaml
- id: user_comment
  type: Flex
  properties:
    gap: 12
    align: start
  slots:
    content:
      blocks:
        - id: user_comment_avatar
          type: Avatar
          properties:
            src: /images/john.png
            size: 32
        - id: user_comment_body
          type: Flex
          properties:
            vertical: true
            gap: 4
          slots:
            content:
              blocks:
                - id: user_comment_author
                  type: Title
                  properties:
                    level: 5
                    content: John Doe
                - id: user_comment_text
                  type: Paragraph
                  properties:
                    content: This looks great!
```

### Before — comment with actions and datetime

```yaml
- id: review_comment
  type: Comment
  properties:
    author:
      _state: comment.author
    content:
      _state: comment.text
    avatar:
      _state: comment.avatarUrl
    datetime:
      _dayjs.fromNow:
        on:
          _state: comment.createdAt
    actions:
      - Reply
      - Like
```

### After

```yaml
- id: review_comment
  type: Flex
  properties:
    gap: 12
    align: start
  slots:
    content:
      blocks:
        - id: review_comment_avatar
          type: Avatar
          properties:
            src:
              _state: comment.avatarUrl
            size: 32
        - id: review_comment_body
          type: Flex
          properties:
            vertical: true
            gap: 4
          slots:
            content:
              blocks:
                - id: review_comment_header
                  type: Flex
                  properties:
                    gap: 8
                    align: center
                  slots:
                    content:
                      blocks:
                        - id: review_comment_author
                          type: Title
                          properties:
                            level: 5
                            content:
                              _state: comment.author
                        - id: review_comment_time
                          type: Paragraph
                          properties:
                            content:
                              _dayjs.fromNow:
                                on:
                                  _state: comment.createdAt
                            type: secondary
                - id: review_comment_text
                  type: Paragraph
                  properties:
                    content:
                      _state: comment.text
                - id: review_comment_actions
                  type: Flex
                  properties:
                    gap: 8
                  slots:
                    content:
                      blocks:
                        - id: review_comment_reply
                          type: Button
                          properties:
                            title: Reply
                            variant: text
                            size: small
                        - id: review_comment_like
                          type: Button
                          properties:
                            title: Like
                            variant: text
                            size: small
```

## Edge Cases

- **Nested comments** (comments inside comments) need recursive Flex layouts — each child comment is another Flex group indented with left margin/padding
- **Comment `actions`** were antd React nodes — in Lowdefy they're typically string labels. Convert to Button blocks with `variant: text` and `size: small`
- **`datetime`** formatting should use `_dayjs` operators, not `_moment` (see prompt 01 of dayjs-migration codemod)
- **Events on Comment** (e.g., `onClick` on action buttons) must be moved to the replacement Button blocks
- If the Comment block used `areas`/`slots` for custom content, preserve the child blocks in the appropriate position within the Flex layout

## Verification

```
grep -rn 'type: Comment' --include='*.yaml' --include='*.yml' .
```

Should return zero matches after migration.
