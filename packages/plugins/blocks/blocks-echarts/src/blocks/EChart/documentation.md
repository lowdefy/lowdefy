<TITLE>
EChart
</TITLE>

<DESCRIPTION>

[Apache ECharts](https://echarts.apache.org/) is a feature rich JavaScript charting library.
This Lowdefy block is a lightweight wrapper around [echarts-for-react](https://www.npmjs.com/package/echarts-for-react), so you configure charts with the standard ECharts option object.

Key behaviour:

- Default size is `300px` tall by `100%` wide unless you set `height` and `width`.
- Dataset sources that resolve to `null` are converted to empty arrays to avoid ECharts warnings.
- A wide range of ECharts lifecycle and interaction events are exposed so you can trigger Lowdefy actions from chart interactions.

See the [Apache ECharts docs](https://echarts.apache.org/en/api.html#echarts) for the full chart and theme APIs, and the [ECharts theme builder](https://echarts.apache.org/en/theme-builder.html) to create custom themes.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "properties": {
      "type": "object",
      "description": "Configuration passed through to echarts-for-react.",
      "additionalProperties": false,
      "properties": {
        "height": {
          "type": ["number", "string"],
          "default": 300,
          "description": "Chart height. Numbers are pixels; strings accept any valid CSS unit (for example `100%`)."
        },
        "width": {
          "type": ["number", "string"],
          "default": "100%",
          "description": "Chart width. Numbers are pixels; strings accept any valid CSS unit."
        },
        "option": {
          "type": "object",
          "description": "Apache ECharts option object passed directly to the renderer.",
          "docs": {
            "displayType": "yaml",
            "url": "https://echarts.apache.org/en/option.html"
          },
          "properties": {
            "title": {
              "type": ["object", "array"],
              "description": "Configure chart titles. Accepts a single object or an array for multiple titles."
            },
            "color": {
              "type": "array",
              "description": "Palette that ECharts applies to series when no explicit colour is set.",
              "items": {
                "type": ["string", "object"]
              }
            },
            "backgroundColor": {
              "type": ["string", "object"],
              "description": "Background colour of the chart canvas."
            },
            "dataset": {
              "type": ["object", "array"],
              "description": "Datasets consumed by the series. When `source` resolves to `null` the block injects an empty array to avoid ECharts warnings."
            },
            "legend": {
              "type": ["object", "array"],
              "description": "Legend configuration. Provide an array for multiple legends."
            },
            "grid": {
              "type": ["object", "array"],
              "description": "Cartesian grid configuration controlling layout, margins and axis overlap."
            },
            "tooltip": {
              "type": "object",
              "description": "Tooltip configuration controlling hover behaviour."
            },
            "toolbox": {
              "type": "object",
              "description": "Toolbox configuration for utility buttons such as save-as-image, data view, and magic type."
            },
            "xAxis": {
              "type": ["object", "array"],
              "description": "Cartesian x-axis settings. Provide an array when multiple axes are required."
            },
            "yAxis": {
              "type": ["object", "array"],
              "description": "Cartesian y-axis settings. Provide an array when multiple axes are required."
            },
            "polar": {
              "type": ["object", "array"],
              "description": "Polar coordinate system configuration."
            },
            "radar": {
              "type": ["object", "array"],
              "description": "Radar coordinate system configuration."
            },
            "angleAxis": {
              "type": ["object", "array"],
              "description": "Angle axis options used with polar coordinate systems."
            },
            "radiusAxis": {
              "type": ["object", "array"],
              "description": "Radius axis options used with polar coordinate systems."
            },
            "singleAxis": {
              "type": ["object", "array"],
              "description": "Single axis configuration for charts such as scatter or heatmap on a single axis."
            },
            "visualMap": {
              "type": ["object", "array"],
              "description": "Visual mapping from data to visual channels such as colour or size."
            },
            "dataZoom": {
              "type": ["object", "array"],
              "description": "Zoom and pan controls for axes."
            },
            "series": {
              "type": ["object", "array"],
              "description": "Series definitions for the chart. Each entry describes one visualisation, such as a bar, line, scatter, pie, treemap, gauge, etc."
            },
            "timeline": {
              "type": ["object", "array"],
              "description": "Timeline configuration for switching between option sets."
            },
            "graphic": {
              "type": ["object", "array"],
              "description": "Arbitrary graphic elements drawn on top of the chart."
            },
            "aria": {
              "type": "object",
              "description": "Accessibility configuration."
            },
            "media": {
              "type": "array",
              "description": "Media query configuration for responsive option overrides."
            }
          },
          "additionalProperties": true
        },
        "theme": {
          "type": "object",
          "description": "Custom theme definition registered at runtime for this block instance. Matches the Apache ECharts theme schema.",
          "docs": {
            "displayType": "yaml",
            "url": "https://echarts.apache.org/en/api.html#echarts.registerTheme"
          }
        },
        "style": {
          "type": "object",
          "description": "CSS style object applied to the wrapper div around the chart.",
          "docs": {
            "displayType": "yaml"
          }
        },
        "init": {
          "type": "object",
          "description": "Init options forwarded to `echarts.init` through echarts-for-react.",
          "docs": {
            "displayType": "yaml",
            "url": "https://echarts.apache.org/en/api.html#echarts.init"
          },
          "properties": {
            "renderer": {
              "type": "string",
              "enum": ["canvas", "svg"],
              "default": "canvas",
              "description": "Renderer to use when creating the chart instance."
            },
            "locale": {
              "type": "string",
              "description": "Locale identifier that must match a locale loaded into ECharts."
            },
            "devicePixelRatio": {
              "type": "number",
              "description": "Override the device pixel ratio used during rendering."
            },
            "width": {
              "type": ["number", "string", "null"],
              "description": "Explicit canvas width passed to `echarts.init`."
            },
            "height": {
              "type": ["number", "string", "null"],
              "description": "Explicit canvas height passed to `echarts.init`."
            },
            "useDirtyRect": {
              "type": "boolean",
              "description": "Enable dirty rectangle rendering optimisation."
            }
          },
          "additionalProperties": true
        }
      }
    },
    "events": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "click": {
          "type": "array",
          "description": "Trigger actions when the chart or a series item is clicked."
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Time series line and bar combination

```yaml
id: status_trend
type: EChart
properties:
  height: 360
  option:
    dataset:
      source:
        _request: get_status_trend
    legend:
      top: 0
    tooltip:
      trigger: axis
    xAxis:
      type: time
      boundaryGap: false
    yAxis:
      type: value
      min: 0
      name: Ticket count
    series:
      - type: line
        name: Resolved
        smooth: true
        areaStyle:
          opacity: 0.15
        encode:
          x: date
          y: resolved_count
      - type: bar
        name: Closed
        encode:
          x: date
          y: closed_count
  theme:
    color:
      - '#4E79A7'
      - '#F28E2B'
      - '#E15759'
```

### Treemap comparing categories

```yaml
id: category_breakdown
type: EChart
properties:
  height: 320
  option:
    title:
      text: Category share
      left: center
    tooltip:
      trigger: item
      formatter: '{b}: {c}'
    series:
      - type: treemap
        roam: false
        label:
          show: true
        data:
          - name: Hardware
            value: 38
          - name: Software
            value: 56
          - name: Services
            value: 24
```

### Heatmap with click handler

```yaml
id: workload_heatmap
type: EChart
properties:
  height: 340
  option:
    dataset:
      source:
        - day: Mon
          period: Morning
          count: 6
        - day: Mon
          period: Afternoon
          count: 3
        - day: Tue
          period: Morning
          count: 9
        - day: Wed
          period: Evening
          count: 12
    tooltip:
      position: 'top'
    grid:
      height: 75%
      top: 40
    xAxis:
      type: category
      name: Day
    yAxis:
      type: category
      name: Period
    visualMap:
      min: 0
      max: 15
      orient: horizontal
      left: center
    series:
      - type: heatmap
        encode:
          x: day
          y: period
          value: count
        emphasis:
          focus: 'series'
events:
  click:
    - id: capture_selection
      type: SetState
      params:
        selected_slot:
          day:
            _event: data.day
          period:
            _event: data.period
          value:
            _event: data.count
```

</EXAMPLES>
