<TITLE>
DangerousHtml
</TITLE>

<DESCRIPTION>

A block to render HTML with the ability to customize the [DOMPurify's options](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).

> The DangerousHtml block sanitizes HTML using [DOMPurify's](https://github.com/cure53/DOMPurify) with the ability to customize the sanitization options. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the DangerousHtml block.

> In short, it is strongly advised to never render any user input DangerousHtml content, only render hardcoded or trusted HTML content.

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
      "DOMPurifyOptions": {
        "type": "object",
        "description": "Customize DOMPurify options. Options are only applied when the block is mounted, thus any parsed settings is only applied at first render.",
        "docs": {
          "displayType": "yaml"
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
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic DangerousHtml

```yaml
id: basic_example
type: DangerousHtml
properties:
  html: |
    <div style="background: #123456; padding: 10px;"><h1 style="color: white;">A simple white title box</h1></div>
```

### DangerousHtml with iframes sanitized

```yaml
id: sanitized_iframes_example
type: DangerousHtml
properties:
  html: |
    The iframe was removed: <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>      - title: DangerousHtml with iframes enabled
```

### DangerousHtml with iframes not sanitized

```yaml
id: iframes_example
type: DangerousHtml
properties:
  DOMPurifyOptions:
    ADD_TAGS:
      - iframe
  html: |
    The iframe was not removed: <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

### DangerousHtml basic sanitization

```yaml
id: sanitized_example
type: DangerousHtml
properties:
  html: |
    <div style="color: red; border: 2px dashed blue; padding: 10px;"><script>alert("hello world")</script><img src=x onerror=alert("img") />A little bit of bad html sanitized.</div>
```

</EXAMPLES>
