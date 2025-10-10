<TITLE>
EChart
</TITLE>

<DESCRIPTION>

[Apache ECharts](https://echarts.apache.org/) is a feature rich javascript charting library.

This implementation is a minimal wrapper for the [echarts-for-react](https://www.npmjs.com/package/echarts-for-react) package. This means you write normal EChart config to create charts.

See the [Apache ECharts docs](https://echarts.apache.org/en/api.html#echarts) for the chart settings API. See the [ECharts theme builder](https://echarts.apache.org/en/theme-builder.html) to create beautiful custom themes.

> View more [Apache EChart examples](https://echarts.apache.org/examples/en/index.html).

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "option": {
        "type": "object",
        "description": "EChart settings object.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "theme": {
        "type": "object",
        "description": "EChart theme object.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "width": {
        "type": ["number", "string"],
        "default": "auto",
        "description": "Specify chart width explicitly, in pixel.",
        "docs": {
          "displayType": "string"
        }
      },
      "height": {
        "type": ["number", "string"],
        "default": "auto",
        "description": "Specify chart height explicitly, in pixel.",
        "docs": {
          "displayType": "string"
        }
      },
      "init": {
        "type": "object",
        "description": "EChart init object.",
        "properties": {
          "renderer": {
            "type": "string",
            "enum": ["canvas", "svg"],
            "default": "canvas",
            "description": "Chart renderer."
          },
          "locale": {
            "type": "string",
            "enum": ["EN", "ZH"],
            "default": "EN",
            "description": "Specify the locale."
          }
        }
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to EChart div.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "properties": {
      "click": {
        "type": "array",
        "description": "Trigger actions when the element is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
