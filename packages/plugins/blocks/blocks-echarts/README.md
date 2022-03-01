# Lowdefy ECharts Blocks

Lowdefy blocks for [Apache ECharts](https://echarts.apache.org/), is a feature rich javascript charting library.

The implementation of these blocks is a minimal wrapper for the [echarts-for-react
](https://www.npmjs.com/package/echarts-for-react) package. This means you write normal EChart config to create charts.

See the [Apache ECharts docs](https://echarts.apache.org/en/api.html#echarts) for the chart settings API.

### EChart Example

```yaml
name: my-app
lowdefy: 3.12.3
pages:
  - id: dashboard
    type: PageHeaderMenu
    blocks:
      - id: line
        type: EChart
        properties:
          height: 600
          option:
            xAxis:
              type: category
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
              - data:
                  - 150
                  - 230
                  - 224
                  - 218
                  - 135
                  - 147
                  - 260
                type: line
```

<!-- TODO
## Other Lowdefy Blocks Packages

- [@lowdefy/blocks-template](https://github.com/lowdefy/blocks-template): Lowdefy template for creating blocks.
- [@lowdefy/blocks-basic](https://github.com/lowdefy/lowdefy/tree/main/packages/blocks/blocksBasic): Official Lowdefy blocks some basic Html elements.
- [@lowdefy/blocks-antd](https://github.com/lowdefy/lowdefy/tree/main/packages/blocks/blocksAntd): Official Lowdefy blocks for [Antd design](https://ant.design/).
- [@lowdefy/blocks-color-selectors](https://github.com/lowdefy/lowdefy/tree/main/packages/blocks/blocksColorSelectors): Official Lowdefy blocks for [react-colorful](https://casesandberg.github.io/react-colorful/).
- [@lowdefy/blocks-markdown](https://github.com/lowdefy/lowdefy/tree/main/packages/blocks/blocksMarkdown): Official Lowdefy blocks to render Markdown.
- [@lowdefy/blocks-amcharts](https://github.com/lowdefy/blocks-amcharts): Lowdefy blocks to render [AmCharts v4](https://www.amcharts.com/).
- [@lowdefy/blocks-aggrid](https://github.com/lowdefy/blocks-aggrid): Lowdefy blocks to render [Ag-Grid](https://www.ag-grid.com/) tables. -->

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
