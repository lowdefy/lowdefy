# EChart

Apache ECharts visualization with full chart configuration support.

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
          formatter: ${value}
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
            color: "#5470c6"
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
            color: "#91cc75"
```

```yaml
- id: line_chart
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: axis
      legend:
        data:
          - Organic
          - Paid
          - Referral
      xAxis:
        type: category
        data:
          - Jan
          - Feb
          - Mar
          - Apr
          - May
          - Jun
          - Jul
          - Aug
      yAxis:
        type: value
      series:
        - name: Organic
          type: line
          smooth: true
          data:
            - 820
            - 932
            - 1100
            - 1234
            - 1390
            - 1530
            - 1620
            - 1780
        - name: Paid
          type: line
          smooth: true
          data:
            - 420
            - 510
            - 635
            - 720
            - 845
            - 910
            - 980
            - 1050
        - name: Referral
          type: line
          smooth: true
          data:
            - 220
            - 280
            - 310
            - 350
            - 410
            - 480
            - 530
            - 590
```

```yaml
- id: pie_chart
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: item
        formatter: "{a} <br/>{b}: {c} ({d}%)"
      legend:
        orient: vertical
        left: left
        data:
          - Direct
          - Search Engine
          - Email
          - Social Media
          - Affiliates
          - Other
      series:
        - name: Traffic Source
          type: pie
          radius:
            - 40%
            - 70%
          avoidLabelOverlap: true
          itemStyle:
            borderRadius: 6
            borderColor: "#fff"
            borderWidth: 2
          label:
            show: true
            formatter: "{b}: {d}%"
          data:
            - name: Direct
              value: 3350
            - name: Search Engine
              value: 5100
            - name: Email
              value: 1548
            - name: Social Media
              value: 2430
            - name: Affiliates
              value: 980
            - name: Other
              value: 620
```

```yaml
- id: area_chart
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: axis
      legend:
        data:
          - Downloads
          - Active Users
      xAxis:
        type: category
        boundaryGap: false
        data:
          - Mon
          - Tue
          - Wed
          - Thu
          - Fri
          - Sat
          - Sun
      yAxis:
        type: value
      series:
        - name: Downloads
          type: line
          smooth: true
          areaStyle:
            opacity: 0.3
          data:
            - 1200
            - 1400
            - 1350
            - 1680
            - 1920
            - 980
            - 870
        - name: Active Users
          type: line
          smooth: true
          areaStyle:
            opacity: 0.3
          data:
            - 450
            - 520
            - 490
            - 610
            - 720
            - 380
            - 340
```

```yaml
- id: scatter_plot
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: item
      xAxis:
        name: Price ($)
        nameLocation: middle
        nameGap: 30
      yAxis:
        name: Rating
        nameLocation: middle
        nameGap: 40
      series:
        - name: Electronics
          type: scatter
          symbolSize: 14
          data:
            - - 29
              - 4.2
            - - 49
              - 4.5
            - - 79
              - 4
            - - 99
              - 4.8
            - - 149
              - 3.9
            - - 199
              - 4.6
            - - 249
              - 4.3
        - name: Furniture
          type: scatter
          symbolSize: 14
          data:
            - - 89
              - 3.8
            - - 159
              - 4.1
            - - 289
              - 4.7
            - - 399
              - 4.4
            - - 449
              - 4.9
            - - 599
              - 4.2
        - name: Accessories
          type: scatter
          symbolSize: 14
          data:
            - - 9
              - 3.5
            - - 15
              - 4
            - - 24
              - 4.3
            - - 39
              - 3.9
            - - 19
              - 4.6
            - - 34
              - 4.1
```

```yaml
- id: mixed_chart
  type: EChart
  properties:
    height: 350
    option:
      tooltip:
        trigger: axis
        axisPointer:
          type: cross
      legend:
        data:
          - Sales Volume
          - Avg Price
      xAxis:
        type: category
        data:
          - Laptops
          - Phones
          - Tablets
          - Watches
          - Headphones
          - Cameras
      yAxis:
        - type: value
          name: Units Sold
          position: left
        - type: value
          name: Avg Price ($)
          position: right
      series:
        - name: Sales Volume
          type: bar
          data:
            - 1240
            - 3560
            - 890
            - 2100
            - 4300
            - 560
          itemStyle:
            color: "#5470c6"
        - name: Avg Price
          type: line
          yAxisIndex: 1
          smooth: true
          data:
            - 899
            - 699
            - 449
            - 299
            - 149
            - 549
          lineStyle:
            width: 3
          itemStyle:
            color: "#ee6666"
```

```yaml
- id: gauge_chart
  type: EChart
  properties:
    height: 350
    option:
      series:
        - type: gauge
          startAngle: 200
          endAngle: -20
          min: 0
          max: 100
          splitNumber: 10
          progress:
            show: true
            width: 20
          pointer:
            show: true
          axisLine:
            lineStyle:
              width: 20
          axisTick:
            show: false
          splitLine:
            length: 10
            lineStyle:
              width: 2
              color: "#999"
          axisLabel:
            distance: 25
            fontSize: 12
            color: "#999"
          title:
            offsetCenter:
              - 0
              - 70%
            fontSize: 16
          detail:
            valueAnimation: true
            fontSize: 32
            offsetCenter:
              - 0
              - 40%
            formatter: "{value}%"
          data:
            - value: 73
              name: Performance
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `option` | object | - | EChart settings object. |
| `theme` | object | - | EChart theme object. |
| `width` | number \| string | `"auto"` | Specify chart width explicitly, in pixel. |
| `height` | number \| string | `"auto"` | Specify chart height explicitly, in pixel. |
| `init` | object | - | EChart init object. |
| `init.renderer` | string | `"canvas"` | Chart renderer. Enum: `canvas`, `svg`. |
| `init.locale` | string | `"EN"` | Specify the locale. Enum: `EN`, `ZH`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `click` | \- | Trigger actions when a chart element is clicked. |
| `dblclick` | \- | Trigger actions when a chart element is double clicked. |
| `mousedown` | \- | Trigger actions when the mouse is pressed on a chart element. |
| `mousemove` | \- | Trigger actions when the mouse moves over a chart element. |
| `mouseup` | \- | Trigger actions when the mouse is released on a chart element. |
| `mouseover` | \- | Trigger actions when the mouse enters a chart element. |
| `mouseout` | \- | Trigger actions when the mouse leaves a chart element. |
| `globalout` | \- | Trigger actions when the mouse leaves the chart. |
| `contextmenu` | \- | Trigger actions on a context menu on a chart element. |
| `highlight` | \- | Trigger actions when a chart element is highlighted. |
| `downplay` | \- | Trigger actions when a chart element highlight is removed. |
| `selectchanged` | \- | Trigger actions when the selected chart elements change. |
| `legendselectchanged` | \- | Trigger actions when the legend selection changes. |
| `legendselected` | \- | Trigger actions when a legend item is selected. |
| `legendunselected` | \- | Trigger actions when a legend item is unselected. |
| `legendselectall` | \- | Trigger actions when all legend items are selected. |
| `legendinverseselect` | \- | Trigger actions when the legend selection is inverted. |
| `legendscroll` | \- | Trigger actions when the legend is scrolled. |
| `datazoom` | \- | Trigger actions when the data zoom range changes. |
| `datarangeselected` | \- | Trigger actions when the visual map range is selected. |
| `timelinechanged` | \- | Trigger actions when the timeline point changes. |
| `timelineplaychanged` | \- | Trigger actions when timeline playback is toggled. |
| `restore` | \- | Trigger actions when the chart is restored. |
| `dataviewchanged` | \- | Trigger actions when the data view toolbox changes the data. |
| `magictypechanged` | \- | Trigger actions when the magic type toolbox changes the chart type. |
| `geoselectchanged` | \- | Trigger actions when the geo selection changes. |
| `geoselected` | \- | Trigger actions when a geo region is selected. |
| `geounselected` | \- | Trigger actions when a geo region is unselected. |
| `axisareaselected` | \- | Trigger actions when a parallel axis area is selected. |
| `brush` | \- | Trigger actions when a brush selection is made. |
| `brushEnd` | \- | Trigger actions when a brush selection ends. |
| `brushselected` | \- | Trigger actions when the brush selects chart elements. |
| `globalcursortaken` | \- | Trigger actions when the global cursor is taken. |
| `rendered` | \- | Trigger actions when the chart is rendered. |
| `finished` | \- | Trigger actions when the chart render is finished. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The EChart element. |

No slots defined.
