<TITLE>
Html
</TITLE>

<DESCRIPTION>

A block to render HTML.

> The Html block sanitizes HTML using [DOMPurify's](https://github.com/cure53/DOMPurify) default configuration. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the Html block. In short, it is strongly advised to never render any user input Html content, only render hardcoded or trusted HTML content.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "html": {
        "type": "string",
        "description": "Content to be rendered as Html.",
        "docs": {
          "displayType": "text-area"
        }
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to Html div.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onTextSelection": {
        "type": "array",
        "description": "Trigger action when text is selected and pass selected text to the event object."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic DangerousHtml

```yaml
id: basic_example
type: Html
properties:
  html: |
    <div style="background: #123456; padding: 10px;"><h1 style="color: white;">A simple white title box</h1></div>
```

### DangerousHtml with iframes sanitized

```yaml
id: sanitized_iframes_example
type: Html
properties:
  html: |
    The iframe was removed: <iframe style="max-width: 512px;" width="100%" src="https://www.youtube.com/embed/7N7GWdlQJlU" frameborder="0"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>      - title: DangerousHtml with iframes enabled
```

### DangerousHtml basic sanitization

```yaml
id: sanitized_example
type: Html
properties:
  html: |
    <div style="color: red; border: 2px dashed blue; padding: 10px;"><script>alert("hello world")</script><img src=x onerror=alert("img") />A little bit of bad html sanitized.</div>
```

</EXAMPLES>
