<TITLE>
Comment
</TITLE>

<DESCRIPTION>

A Comment renders a comment list item. It can be used as both a `display` or `container` category block.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "author": {
        "type": "string",
        "description": "Comment author title. Overrides the \"author\" content area."
      },
      "avatar": {
        "oneOf": [
          {
            "type": "string",
            "description": "Source URL of a avatar image."
          },
          {
            "type": "object",
            "description": "Avatar block properties.",
            "docs": {
              "displayType": "avatar"
            }
          }
        ]
      },
      "content": {
        "type": "string",
        "description": "Comment content. Overrides the \"content\" content area."
      },
      "datetime": {
        "type": ["object", "string"],
        "description": "Comment date and time.",
        "docs": {
          "displayType": "string"
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Comment

```yaml
id: comment_ex
type: Comment
properties:
  author: The Dude
  avatar:
    color: '#402B18'
    content: TD
    shape: square
  content: "Yeah, well, you know, that\u2019s just, like, your opinion, man."
  datetime: 18 January, 1998
```

</EXAMPLES>
