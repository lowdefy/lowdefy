# @lowdefy/blocks-color-selectors

Color picker blocks for Lowdefy.

## Blocks

| Block                  | Purpose                     |
| ---------------------- | --------------------------- |
| `ChromeColorSelector`  | Chrome-style color picker   |
| `CircleColorSelector`  | Circular color palette      |
| `TwitterColorSelector` | Twitter-style color palette |

## ChromeColorSelector

Full-featured color picker:

```yaml
- id: color
  type: ChromeColorSelector
  properties:
    label:
      title: Pick a color
```

## CircleColorSelector

Circular color palette:

```yaml
- id: themeColor
  type: CircleColorSelector
  properties:
    colors:
      - '#FF6900'
      - '#FCB900'
      - '#00D084'
      - '#0693E3'
```

## TwitterColorSelector

Preset color palette (like Twitter):

```yaml
- id: labelColor
  type: TwitterColorSelector
```

## Value Format

All color selectors store RGBA object:

```javascript
{
  r: 255,
  g: 0,
  b: 0,
  a: 1
}
```
