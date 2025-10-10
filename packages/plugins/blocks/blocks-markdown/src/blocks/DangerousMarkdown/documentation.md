<TITLE>
DangerousMarkdown
</TITLE>

<DESCRIPTION>

Render markdown content which can include HTML elements. If the markdown content does not need to render HTML, use the [Markdown](/Markdown) or [MarkdownWithCode](/MarkdownWithCode) blocks instead. Specify what HTML element to allow or remove by changing the default modifying the [DOMPurify's options](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).

> The DangerousMarkdown block sanitizes the markdown content using [DOMPurify's](https://github.com/cure53/DOMPurify) before converting the markdown to HTML. DangerousMarkdown provides the ability to customize the sanitization options. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the DangerousMarkdown block.

> In short, it is strongly advised to never render any user input DangerousMarkdown content, only render hardcoded or trusted markdown and HTML content.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string",
        "description": "Content in markdown format.",
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
        "description": "Style to apply to Markdown div.",
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

### DangerousMarkdown headings

```yaml
id: iframes_example
type: DangerousMarkdown
properties:
  DOMPurifyOptions:
    ADD_TAGS:
      - iframe
  content: |
    # Markdown with an iframe: <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

</EXAMPLES>
