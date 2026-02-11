# @lowdefy/blocks-echarts

[Apache ECharts](https://echarts.apache.org/en/option.html) integration for Lowdefy. Provides rich data visualization capabilities.

## Overview

ECharts is a powerful charting library supporting:
- Line, bar, pie, scatter charts
- Heatmaps, treemaps, sunburst
- Geographic maps
- 3D visualizations
- Animation and interactivity

## Block

| Block | Purpose |
|-------|---------|
| `EChart` | ECharts visualization |

## Basic Usage

```yaml
- id: salesChart
  type: EChart
  properties:
    height: 400
    option:
      title:
        text: Monthly Sales
      xAxis:
        type: category
        data:
          _request: getMonths
      yAxis:
        type: value
      series:
        - type: bar
          data:
            _request: getSalesData
```

## Key Properties

| Property | Purpose |
|----------|---------|
| `height` | Chart height (required) |
| `width` | Chart width (default: 100%) |
| `option` | ECharts configuration object |
| `theme` | ECharts theme name |

## Chart Types

ECharts supports many chart types via `series.type`:

- `line` - Line chart
- `bar` - Bar chart
- `pie` - Pie chart
- `scatter` - Scatter plot
- `radar` - Radar chart
- `heatmap` - Heatmap
- `treemap` - Treemap
- `sunburst` - Sunburst chart
- `graph` - Network graph
- `map` - Geographic map

## Events

```yaml
events:
  onClick:
    - id: drillDown
      type: SetState
      params:
        selectedCategory:
          _event: name
```

## Design Decisions

### Why ECharts?

- Comprehensive chart library
- Good performance with large datasets
- Rich customization options
- Active community

### Why Separate Package?

ECharts is large (~800KB minified). Separating it:
- Reduces bundle size for apps without charts
- Loads on demand
