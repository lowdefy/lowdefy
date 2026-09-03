---
name: lowdefy-charts
description: Use when rendering a chart from request data with EChart — mapping rows to series, axes, tooltips, responsive sizing and empty/loading states.
---

# Charts

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### EChart

`/lowdefy-docs/content/display-blocks/echart`

Apache ECharts visualization with full chart configuration support.

### Blocks

Live schema: `lowdefy_get_schema` with kind `blocks`.

#### EChart

Provided by `@lowdefy/blocks-echarts`. Category: `display`.

##### Properties

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `option` | object |  |  | EChart settings object. |
| `theme` | object |  |  | EChart theme object. |
| `width` | number \\| string |  | `"auto"` | Specify chart width explicitly, in pixel. |
| `height` | number \\| string |  | `"auto"` | Specify chart height explicitly, in pixel. |
| `init` | object |  |  | EChart init object. |

##### Events

- `click`: Trigger actions when a chart element is clicked.
- `dblclick`: Trigger actions when a chart element is double clicked.
- `mousedown`: Trigger actions when the mouse is pressed on a chart element.
- `mousemove`: Trigger actions when the mouse moves over a chart element.
- `mouseup`: Trigger actions when the mouse is released on a chart element.
- `mouseover`: Trigger actions when the mouse enters a chart element.
- `mouseout`: Trigger actions when the mouse leaves a chart element.
- `globalout`: Trigger actions when the mouse leaves the chart.
- `contextmenu`: Trigger actions on a context menu on a chart element.
- `highlight`: Trigger actions when a chart element is highlighted.
- `downplay`: Trigger actions when a chart element highlight is removed.
- `selectchanged`: Trigger actions when the selected chart elements change.
- `legendselectchanged`: Trigger actions when the legend selection changes.
- `legendselected`: Trigger actions when a legend item is selected.
- `legendunselected`: Trigger actions when a legend item is unselected.
- `legendselectall`: Trigger actions when all legend items are selected.
- `legendinverseselect`: Trigger actions when the legend selection is inverted.
- `legendscroll`: Trigger actions when the legend is scrolled.
- `datazoom`: Trigger actions when the data zoom range changes.
- `datarangeselected`: Trigger actions when the visual map range is selected.
- `timelinechanged`: Trigger actions when the timeline point changes.
- `timelineplaychanged`: Trigger actions when timeline playback is toggled.
- `restore`: Trigger actions when the chart is restored.
- `dataviewchanged`: Trigger actions when the data view toolbox changes the data.
- `magictypechanged`: Trigger actions when the magic type toolbox changes the chart type.
- `geoselectchanged`: Trigger actions when the geo selection changes.
- `geoselected`: Trigger actions when a geo region is selected.
- `geounselected`: Trigger actions when a geo region is unselected.
- `axisareaselected`: Trigger actions when a parallel axis area is selected.
- `brush`: Trigger actions when a brush selection is made.
- `brushEnd`: Trigger actions when a brush selection ends.
- `brushselected`: Trigger actions when the brush selects chart elements.
- `globalcursortaken`: Trigger actions when the global cursor is taken.
- `rendered`: Trigger actions when the chart is rendered.
- `finished`: Trigger actions when the chart render is finished.

##### Example

```yaml
- id: bar_chart
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: axis
      legend:
        data:
          - Revenue
          - Expenses
      xAxis:
        type: category
        data:
          - Jan
          - Feb
          - Mar
          - Apr
          - May
          - Jun
      yAxis:
        type: value
        axisLabel:
          formatter: '${value}'
      series:
        - name: Revenue
          type: bar
          data:
            - 4200
            - 3800
            - 5100
            - 4600
            - 5800
            - 6200
          itemStyle:
            color: '#5470c6'
        - name: Expenses
          type: bar
          data:
            - 3100
            - 2900
            - 3400
            - 3200
            - 3600
            - 3800
          itemStyle:
            color: '#91cc75'
```

### Operators

Live schema: `lowdefy_get_schema` with kind `operators`.

#### _array

Provided by `@lowdefy/operators-js`.

Accepts any: Array method params. Accepts array positional args or object with named args depending on method.

#### _get

Provided by `@lowdefy/operators-js`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `from` | any | yes |  | Object or array to get value from. |
| `key` | string |  |  | Dot-notation path to the value. |
| `default` | any |  |  | Default value if key does not exist. |
| `all` | boolean |  |  | Return all matching values. |
<!-- generated:reference:end -->

## Recipe

Must cover: `option` built from `_request` data, mapping rows to `xAxis.data` and `series[].data` with `_array.map`, `height`, `onClick` events with the clicked datum, and an empty state when the request returns no rows.
