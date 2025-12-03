<TITLE>
ColorSelector
</TITLE>

<DESCRIPTION>

A color selector component.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed."
      },
      "inputStyle": {
        "type": "object",
        "description": "Css style to applied to input.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "If true, the input is disabled."
      },
      "hideInput": {
        "type": "boolean",
        "default": false,
        "description": "If true, the input is hidden."
      },
      "label": {
        "type": "object",
        "description": "Label properties.",
        "additionalProperties": false,
        "properties": {
          "align": {
            "type": "string",
            "enum": ["left", "right"],
            "default": "left",
            "description": "Align label left or right when inline."
          },
          "colon": {
            "type": "boolean",
            "default": true,
            "description": "Append label with colon."
          },
          "extra": {
            "type": "string",
            "description": "Extra text to display beneath the content."
          },
          "title": {
            "type": "string",
            "description": "Label title."
          },
          "span": {
            "type": "number",
            "description": "Label inline span."
          },
          "disabled": {
            "type": "boolean",
            "default": false,
            "description": "Hide input label."
          },
          "hasFeedback": {
            "type": "boolean",
            "default": true,
            "description": "Display feedback extra from validation, this does not disable validation."
          },
          "inline": {
            "type": "boolean",
            "default": false,
            "description": "Render input and label inline."
          },
          "extraStyle": {
            "type": "object",
            "description": "Css style to applied to label extra.",
            "docs": {
              "displayType": "yaml"
            }
          },
          "feedbackStyle": {
            "type": "object",
            "description": "Css style to applied to label feedback.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onChange": {
        "type": "array",
        "description": "Trigger actions when color is picked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic ColorSelector

```yaml
id: basic_color
type: ColorSelector
properties:
  title: Pick a color
```

### ColorSelector with inline label and help text

```yaml
id: inline_label_color
type: ColorSelector
properties:
  label:
    title: Brand color
    extra: Choose the primary color for your theme.
    inline: true
    span: 6
```

### Hidden input (swatch only)

```yaml
id: swatch_only_color
type: ColorSelector
properties:
  title: Swatch only
  hideInput: true
```

### Disabled ColorSelector

```yaml
id: disabled_color
type: ColorSelector
properties:
  title: Disabled color selector
  disabled: true
```

### Trigger action on color change

```yaml
id: brand_color
type: ColorSelector
properties:
  title: Brand color
events:
  onChange:
    - id: set_brand_color
      type: SetState
      params:
        brand_color:
          _event: value
```

</EXAMPLES>
