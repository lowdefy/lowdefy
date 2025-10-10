<TITLE>
Img
</TITLE>

<DESCRIPTION>

A block to render a HTML [`<img/>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) element.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "required": ["src"],
    "properties": {
      "src": {
        "type": "string",
        "description": "The image URL."
      },
      "alt": {
        "type": "string",
        "description": "Alternative text description of the image."
      },
      "crossOrigin": {
        "type": "string",
        "enum": ["anonymous", "use-credentials"],
        "description": "Indicates if the fetching of the image must be done using a CORS request."
      },
      "decoding": {
        "type": "string",
        "enum": ["sync", "async", "auto"],
        "description": "An image decoding hint to the browser. Sync for atomic presentation with other content, async,  to reduce delay in presenting other content and auto leave to browser to decide."
      },
      "height": {
        "type": "number",
        "description": "Height of the image."
      },
      "loading": {
        "type": "string",
        "enum": ["eager", "lazy"],
        "description": "How the browser should load the image. Eager loads the image immediately, lazy, defers loading until the image it reaches a calculated distance from the viewport, as defined by the browser."
      },
      "sizes": {
        "type": "string",
        "description": "Indicating a set of source sizes of strings separated by commas."
      },
      "srcSet": {
        "type": "string",
        "description": "Possible image sources for the user agent to use, strings separated by commas.",
        "docs": {
          "displayType": "text-area"
        }
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to the image.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "width": {
        "type": "number",
        "description": "Width of the image."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic Img

```yaml
id: basic_example
type: Img
properties:
  src: https://docs.lowdefy.com/logo-light-theme.png
```

### srcset Img

```yaml
id: srcset_example
type: Img
properties:
  src: https://docs.lowdefy.com/logo-light-theme.png
  srcSet: https://docs.lowdefy.com/logo-square-light-theme.png 40w, https://docs.lowdefy.com/logo-light-theme.png 577w
  sizes: '(max-width: 576px) 40px, 577px'
```

</EXAMPLES>
