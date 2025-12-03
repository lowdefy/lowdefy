<TITLE>
_media
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_media` operator retrieves information about the user's current browser window size from the [`media`](/page-and-app-state) object. This enables responsive design decisions within your Lowdefy configuration, allowing you to show/hide elements, change layouts, or adjust content based on screen dimensions.

**Available Properties:**

- `width: number` - The viewport width in pixels
- `height: number` - The viewport height in pixels
- `size: string` - A size category based on width breakpoints:
  - `xs`: width < 576px (extra small / mobile)
  - `sm`: 576px ≤ width < 768px (small / large mobile)
  - `md`: 768px ≤ width < 992px (medium / tablet)
  - `lg`: 992px ≤ width < 1200px (large / small desktop)
  - `xl`: 1200px ≤ width < 1600px (extra large / desktop)
  - `xxl`: 1600px ≤ width (extra extra large / large desktop)

> **Note**: This operator can only be used on the web client, not in requests or connections.
> </DESCRIPTION>

<SCHEMA>
```yaml
_media:
  type: string | boolean | object
  description: Access values from the media object.
  oneOf:
    - type: string
      description: The property to retrieve (width, height, or size).
    - type: boolean
      description: If true, returns the entire media object.
    - type: object
      properties:
        key:
          type: string
          description: The property to retrieve.
        all:
          type: boolean
          description: If true, returns the entire media object.
        default:
          type: any
          description: Value to return if the property is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic size detection

Display responsive content based on screen size.

```yaml
id: responsive_title
type: Title
properties:
  level:
    _switch:
      branches:
        - if:
            _eq:
              - _media: size
              - xs
          then: 4
        - if:
            _eq:
              - _media: size
              - sm
          then: 3
      default: 2
  content:
    _if:
      test:
        _or:
          - _eq:
              - _media: size
              - xs
          - _eq:
              - _media: size
              - sm
      then: Dashboard
      else: Welcome to Your Dashboard
```

---

###### Example 2: Hide/show elements for mobile

Control component visibility based on device size.

```yaml
id: desktop_sidebar
type: Card
visible:
  _not:
    _or:
      - _eq:
          - _media: size
          - xs
      - _eq:
          - _media: size
          - sm
properties:
  title: Quick Actions
blocks:
  - id: action_list
    type: List
    properties:
      data:
        _global: quick_actions

id: mobile_menu_button
type: Button
visible:
  _or:
    - _eq:
        - _media: size
        - xs
    - _eq:
        - _media: size
        - sm
properties:
  title: Menu
  icon: AiOutlineMenu
events:
  onClick:
    - id: open_drawer
      type: SetState
      params:
        drawer_visible: true
```

---

###### Example 3: Responsive grid layouts

Adjust column spans based on viewport width.

```yaml
id: product_card
type: Card
layout:
  span:
    _switch:
      branches:
        - if:
            _eq:
              - _media: size
              - xs
          then: 24 # Full width on mobile
        - if:
            _eq:
              - _media: size
              - sm
          then: 12 # Half width on small screens
        - if:
            _eq:
              - _media: size
              - md
          then: 8 # Third width on medium screens
      default: 6 # Quarter width on large screens
properties:
  title:
    _state: product.name
```

---

###### Example 4: Conditional image sizes

Load appropriately sized images based on screen width.

```yaml
id: hero_image
type: Image
properties:
  src:
    _switch:
      branches:
        - if:
            _lt:
              - _media: width
              - 576
          then: /images/hero-mobile.jpg
        - if:
            _lt:
              - _media: width
              - 992
          then: /images/hero-tablet.jpg
      default: /images/hero-desktop.jpg
  alt: Hero Banner
  style:
    width: 100%
    maxHeight:
      _if:
        test:
          _or:
            - _eq:
                - _media: size
                - xs
            - _eq:
                - _media: size
                - sm
        then: 200px
        else: 400px
```

---

###### Example 5: Complex responsive layouts with media queries

Build a complete responsive experience using media data.

```yaml
id: dashboard_layout
type: Box
layout:
  contentGutter:
    _switch:
      branches:
        - if:
            _eq:
              - _media: size
              - xs
          then: 8
        - if:
            _eq:
              - _media: size
              - sm
          then: 12
      default: 16
blocks:
  # Stats row - responsive cards
  - id: stats_row
    type: Box
    layout:
      direction:
        _if:
          test:
            _or:
              - _eq:
                  - _media: size
                  - xs
              - _eq:
                  - _media: size
                  - sm
          then: column
          else: row
    blocks:
      - id: stat_revenue
        type: Statistic
        layout:
          span:
            _if:
              test:
                _lte:
                  - _media: width
                  - 768
              then: 24
              else: 8
        properties:
          title: Revenue
          value:
            _state: stats.revenue

      - id: stat_orders
        type: Statistic
        layout:
          span:
            _if:
              test:
                _lte:
                  - _media: width
                  - 768
              then: 24
              else: 8
        properties:
          title: Orders
          value:
            _state: stats.orders

  # Data table with responsive columns
  - id: data_table
    type: AgGridAlpine
    properties:
      domLayout:
        _if:
          test:
            _lt:
              - _media: width
              - 768
          then: autoHeight
          else: normal
      columnDefs:
        _if:
          test:
            _lt:
              - _media: width
              - 768
          then:
            # Mobile: Show only essential columns
            - field: name
              headerName: Item
            - field: total
              headerName: Total
          else:
            # Desktop: Show all columns
            - field: name
              headerName: Item Name
            - field: category
              headerName: Category
            - field: quantity
              headerName: Qty
            - field: price
              headerName: Unit Price
            - field: total
              headerName: Total

  # Debug info (development only)
  - id: media_debug
    type: Descriptions
    visible:
      _global: features.debug_mode
    properties:
      title: Screen Info
      items:
        - label: Width
          value:
            _string.concat:
              - _media: width
              - 'px'
        - label: Height
          value:
            _string.concat:
              - _media: height
              - 'px'
        - label: Size Category
          value:
            _media: size
```

</EXAMPLES>
