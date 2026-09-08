# Pagination

Pagination control with page size changer and quick jumper. Maintains `current`, `pageSize`, and `skip` in block state, making it easy to wire into database queries for server-side pagination. See the guide below for a full MongoDB + AgGrid example.

## Example: Server-side pagination with MongoDB

Pass `skip` and `pageSize` via the request `_payload`, then re-fetch on page change:

```yaml
requests:
  - id: get_items
    type: MongoDBAggregation
    connectionId: mongodb
    payload:
      pagination:
        _state: pagination
    properties:
      pipeline:
        - $facet:
            rows:
              - $skip:
                  _payload: pagination.skip
              - $limit:
                  _payload: pagination.pageSize
            count:
              - $count: total

blocks:
  - id: pagination
    type: Pagination
    properties:
      total:
        _request: get_items.count.0.total
      showSizeChanger: true
      showTotal: true
    events:
      onChange:
        - id: refetch
          type: Request
          params: get_items
      onSizeChange:
        - id: refetch
          type: Request
          params: get_items

  - id: table
    type: AgGridAlpine
    properties:
      rowData:
        _request: get_items.rows
      columnDefs:
        - field: name
        - field: status
        - field: createdAt
```

`$facet` returns both paginated rows and the total count in one query. The Pagination block maintains `skip` and `pageSize` in state automatically. State values are passed to the request via `payload` / `_payload` so they are evaluated server-side.

**Default size:**

**Small size:**

```yaml
- id: size_default_label
  type: Markdown
  properties:
    content: "**Default size:**"
- id: size_default
  type: Pagination
  properties:
    total: 100
- id: size_small_label
  type: Markdown
  properties:
    content: "**Small size:**"
- id: size_small
  type: Pagination
  properties:
    total: 100
    size: small
```

**Simple (default size):**

**Simple (small size):**

```yaml
- id: simple_default_label
  type: Markdown
  properties:
    content: "**Simple (default size):**"
- id: simple_default
  type: Pagination
  properties:
    total: 100
    simple: true
- id: simple_small_label
  type: Markdown
  properties:
    content: "**Simple (small size):**"
- id: simple_small
  type: Pagination
  properties:
    total: 100
    simple: true
    size: small
```

**Boolean (default format):**

**Custom string:**

**Show total (small):**

```yaml
- id: show_total_bool_label
  type: Markdown
  properties:
    content: "**Boolean (default format):**"
- id: show_total_bool
  type: Pagination
  properties:
    total: 85
    showTotal: true
- id: show_total_string_label
  type: Markdown
  properties:
    content: "**Custom string:**"
- id: show_total_string
  type: Pagination
  properties:
    total: 85
    showTotal: 85 results found
- id: show_total_small_label
  type: Markdown
  properties:
    content: "**Show total (small):**"
- id: show_total_small
  type: Pagination
  properties:
    total: 200
    showTotal: true
    size: small
```

**Default page size options:**

**Custom page size options:**

**Size changer (small):**

```yaml
- id: size_changer_label
  type: Markdown
  properties:
    content: "**Default page size options:**"
- id: size_changer_default
  type: Pagination
  properties:
    total: 200
    showSizeChanger: true
- id: size_changer_custom_label
  type: Markdown
  properties:
    content: "**Custom page size options:**"
- id: size_changer_custom
  type: Pagination
  properties:
    total: 500
    showSizeChanger: true
    pageSizeOptions:
      - 5
      - 15
      - 25
      - 50
      - 100
- id: size_changer_small_label
  type: Markdown
  properties:
    content: "**Size changer (small):**"
- id: size_changer_small
  type: Pagination
  properties:
    total: 200
    showSizeChanger: true
    size: small
```

**Quick jumper enabled:**

**Quick jumper (small):**

```yaml
- id: quick_jumper_label
  type: Markdown
  properties:
    content: "**Quick jumper enabled:**"
- id: quick_jumper
  type: Pagination
  properties:
    total: 500
    showQuickJumper: true
- id: quick_jumper_small_label
  type: Markdown
  properties:
    content: "**Quick jumper (small):**"
- id: quick_jumper_small
  type: Pagination
  properties:
    total: 500
    showQuickJumper: true
    size: small
```

**Default options [10, 20, 30, 40]:**

**Custom options [5, 10, 50, 100]:**

**Large page sizes [25, 50, 100, 200]:**

```yaml
- id: page_size_default_label
  type: Markdown
  properties:
    content: "**Default options [10, 20, 30, 40]:**"
- id: page_size_default
  type: Pagination
  properties:
    total: 300
    showSizeChanger: true
- id: page_size_custom_label
  type: Markdown
  properties:
    content: "**Custom options [5, 10, 50, 100]:**"
- id: page_size_custom
  type: Pagination
  properties:
    total: 300
    showSizeChanger: true
    pageSizeOptions:
      - 5
      - 10
      - 50
      - 100
- id: page_size_large_label
  type: Markdown
  properties:
    content: "**Large page sizes [25, 50, 100, 200]:**"
- id: page_size_large
  type: Pagination
  properties:
    total: 1000
    showSizeChanger: true
    pageSizeOptions:
      - 25
      - 50
      - 100
      - 200
```

**Multiple pages (visible):**

**Single page (hidden - nothing renders below):**

**Single page (hideOnSinglePage false):**

```yaml
- id: hide_single_visible_label
  type: Markdown
  properties:
    content: "**Multiple pages (visible):**"
- id: hide_single_visible
  type: Pagination
  properties:
    total: 50
    hideOnSinglePage: true
- id: hide_single_hidden_label
  type: Markdown
  properties:
    content: "**Single page (hidden - nothing renders below):**"
- id: hide_single_hidden
  type: Pagination
  properties:
    total: 5
    hideOnSinglePage: true
- id: hide_single_no_hide_label
  type: Markdown
  properties:
    content: "**Single page (hideOnSinglePage false):**"
- id: hide_single_no_hide
  type: Pagination
  properties:
    total: 5
    hideOnSinglePage: false
```

**Small total (30):**

**Medium total (100):**

**Large total (500):**

**Very large total (10000):**

```yaml
- id: total_small_label
  type: Markdown
  properties:
    content: "**Small total (30):**"
- id: total_small
  type: Pagination
  properties:
    total: 30
- id: total_medium_label
  type: Markdown
  properties:
    content: "**Medium total (100):**"
- id: total_medium
  type: Pagination
  properties:
    total: 100
- id: total_large_label
  type: Markdown
  properties:
    content: "**Large total (500):**"
- id: total_large
  type: Pagination
  properties:
    total: 500
- id: total_very_large_label
  type: Markdown
  properties:
    content: "**Very large total (10000):**"
- id: total_very_large
  type: Pagination
  properties:
    total: 10000
```

**Basic disabled:**

**Disabled (small):**

**Disabled with all features:**

**Disabled simple mode:**

```yaml
- id: disabled_basic_label
  type: Markdown
  properties:
    content: "**Basic disabled:**"
- id: disabled_basic
  type: Pagination
  properties:
    total: 100
    disabled: true
- id: disabled_small_label
  type: Markdown
  properties:
    content: "**Disabled (small):**"
- id: disabled_small
  type: Pagination
  properties:
    total: 100
    disabled: true
    size: small
- id: disabled_features_label
  type: Markdown
  properties:
    content: "**Disabled with all features:**"
- id: disabled_features
  type: Pagination
  properties:
    total: 200
    disabled: true
    showSizeChanger: true
    showQuickJumper: true
    showTotal: true
- id: disabled_simple_label
  type: Markdown
  properties:
    content: "**Disabled simple mode:**"
- id: disabled_simple
  type: Pagination
  properties:
    total: 100
    disabled: true
    simple: true
```

**All features enabled:**

**All features (small):**

**Total + size changer:**

**Total + quick jumper:**

**Size changer + quick jumper:**

```yaml
- id: combined_all_label
  type: Markdown
  properties:
    content: "**All features enabled:**"
- id: combined_all
  type: Pagination
  properties:
    total: 500
    showSizeChanger: true
    showQuickJumper: true
    showTotal: true
- id: combined_all_small_label
  type: Markdown
  properties:
    content: "**All features (small):**"
- id: combined_all_small
  type: Pagination
  properties:
    total: 500
    showSizeChanger: true
    showQuickJumper: true
    showTotal: true
    size: small
- id: combined_total_changer_label
  type: Markdown
  properties:
    content: "**Total + size changer:**"
- id: combined_total_changer
  type: Pagination
  properties:
    total: 300
    showTotal: true
    showSizeChanger: true
- id: combined_total_jumper_label
  type: Markdown
  properties:
    content: "**Total + quick jumper:**"
- id: combined_total_jumper
  type: Pagination
  properties:
    total: 300
    showTotal: true
    showQuickJumper: true
- id: combined_changer_jumper_label
  type: Markdown
  properties:
    content: "**Size changer + quick jumper:**"
- id: combined_changer_jumper
  type: Pagination
  properties:
    total: 300
    showSizeChanger: true
    showQuickJumper: true
```

```yaml
- id: with_label_default
  type: Pagination
  properties:
    title: Page Navigation
    total: 100
- id: with_label_inline
  type: Pagination
  properties:
    title: Results
    total: 200
    showTotal: true
    label:
      inline: true
      span: 6
```

**Custom background and padding:**

**Centered with border:**

**Right aligned:**

```yaml
- id: style_background_label
  type: Markdown
  properties:
    content: "**Custom background and padding:**"
- id: style_background
  type: Pagination
  style:
    .element:
      background: var(--ant-color-bg-layout)
      padding: 12
      borderRadius: 8
  properties:
    total: 100
- id: style_centered_label
  type: Markdown
  properties:
    content: "**Centered with border:**"
- id: style_centered
  type: Pagination
  style:
    .element:
      border: 1px solid
      borderRadius: 8
      padding: 12
      display: flex
      justifyContent: center
  properties:
    total: 100
- id: style_right_label
  type: Markdown
  properties:
    content: "**Right aligned:**"
- id: style_right
  type: Pagination
  style:
    .element:
      display: flex
      justifyContent: flex-end
  properties:
    total: 100
```

**Tailwind background and padding:**

**Tailwind border and centered:**

**Tailwind shadow:**

```yaml
- id: class_bg_label
  type: Markdown
  properties:
    content: "**Tailwind background and padding:**"
- id: class_bg
  type: Pagination
  class: bg-bg-layout p-3 rounded-lg
  properties:
    total: 100
- id: class_border_label
  type: Markdown
  properties:
    content: "**Tailwind border and centered:**"
- id: class_border
  type: Pagination
  class: border border-border rounded-lg p-3 flex justify-center
  properties:
    total: 100
- id: class_shadow_label
  type: Markdown
  properties:
    content: "**Tailwind shadow:**"
- id: class_shadow
  type: Pagination
  class: shadow-md rounded-lg p-3 bg-bg-container
  properties:
    total: 100
```

**Custom primary color:**

**Large pagination items:**

**Small rounded items:**

**Custom active colors:**

**Combined token overrides:**

```yaml
- id: theme_primary_label
  type: Markdown
  properties:
    content: "**Custom primary color:**"
- id: theme_primary
  type: Pagination
  properties:
    total: 100
    theme:
      colorPrimary: "#722ed1"
- id: theme_large_items_label
  type: Markdown
  properties:
    content: "**Large pagination items:**"
- id: theme_large_items
  type: Pagination
  properties:
    total: 100
    theme:
      itemSize: 40
      fontSize: 16
      borderRadius: 20
- id: theme_small_items_label
  type: Markdown
  properties:
    content: "**Small rounded items:**"
- id: theme_small_items
  type: Pagination
  properties:
    total: 100
    theme:
      itemSize: 24
      borderRadius: 12
      fontSize: 12
- id: theme_active_color_label
  type: Markdown
  properties:
    content: "**Custom active colors:**"
- id: theme_active_color
  type: Pagination
  properties:
    total: 100
    theme:
      colorPrimary: "#0958d9"
- id: theme_combined_label
  type: Markdown
  properties:
    content: "**Combined token overrides:**"
- id: theme_combined
  type: Pagination
  properties:
    total: 200
    showSizeChanger: true
    showQuickJumper: true
    showTotal: true
    theme:
      colorPrimary: "#52c41a"
      itemSize: 36
      borderRadius: 8
      fontSize: 14
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `total` | integer | `100` | Total number of items to be displayed in pagination. |
| `size` | string | `"default"` | Pagination element size. Enum: `small`, `default`. |
| `simple` | boolean | `false` | Use simplified pagination display. |
| `showTotal` | boolean \| string \| object | `false` | Show pagination total number and range if boolean, or define a custom string or function to display. |
| `showSizeChanger` | boolean | `false` | Determine whether to show page size select, it will be true when total > 50. |
| `showQuickJumper` | boolean | `false` | Determine whether you can jump to pages directly. |
| `pageSizeOptions` | array | `[10,20,30,40]` | Specify the page size changer options. |
| `hideOnSinglePage` | boolean | `false` | Hide pager on short list of a single page. |
| `disabled` | boolean | `false` | Disable pager. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design pagination tokens](https://ant.design/components/pagination#design-token). |
| `theme.itemBg` | string | `"#ffffff"` | Background color for pagination items. |
| `theme.itemSize` | number | `32` | Size of pagination items. |
| `theme.itemSizeSM` | number | `24` | Size of pagination items in small mode. |
| `theme.itemActiveBg` | string | `"#ffffff"` | Background color for the active pagination item. |
| `theme.itemActiveColor` | string | - | Text color for the active pagination item. |
| `theme.itemActiveColorDisabled` | string | `"rgba(0,0,0,0.25)"` | Text color for the active item when disabled. |
| `theme.itemActiveBgDisabled` | string | `"rgba(0,0,0,0.15)"` | Background color for the active item when disabled. |
| `theme.itemLinkBg` | string | `"#ffffff"` | Background color for prev/next link items. |
| `theme.itemInputBg` | string | `"#ffffff"` | Background color for the quick jumper input. |
| `theme.miniOptionsSizeChangerTop` | number | `0` | Top offset for the size changer in mini/small mode. |
| `theme.colorPrimary` | string | - | Primary color for active and hover states. |
| `theme.colorPrimaryHover` | string | - | Primary color on hover. |
| `theme.colorText` | string | - | Default text color for pagination items. |
| `theme.colorBorder` | string | - | Border color for pagination items. |
| `theme.borderRadius` | number | `6` | Border radius for pagination items. |
| `theme.fontSize` | number | `14` | Font size for pagination items. |
| `theme.controlHeight` | number | `32` | Control height, affects item size. |
| `theme.paddingBlock` | number | `4` | Vertical padding for pagination items. |
| `theme.paddingBlockSM` | number | `0` | Vertical padding for small pagination items. |
| `theme.paddingBlockLG` | number | `7` | Vertical padding for large pagination items. |
| `theme.paddingInline` | number | `11` | Horizontal padding for pagination items. |
| `theme.paddingInlineSM` | number | `7` | Horizontal padding for small pagination items. |
| `theme.paddingInlineLG` | number | `11` | Horizontal padding for large pagination items. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onSizeChange` | `{ current, pageSize, skip }` | Triggered when page size is changed. |
| `onChange` | `{ current, pageSize, skip }` | Triggered when current page is changed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Pagination element. |

No slots defined.
