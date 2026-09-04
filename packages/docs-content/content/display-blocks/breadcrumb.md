# Breadcrumb

Navigation breadcrumb showing the current location in a hierarchy.

```yaml
- id: basic_strings
  type: Breadcrumb
  properties:
    list:
      - Home
      - Application Center
      - Application List
      - An Application
- id: basic_objects
  type: Breadcrumb
  properties:
    list:
      - label: Home
      - label: Products
      - label: Electronics
      - label: Headphones
- id: basic_two_items
  type: Breadcrumb
  properties:
    list:
      - Home
      - Current Page
```

```yaml
- id: separator_default
  type: Breadcrumb
  properties:
    list:
      - Home
      - Category
      - Item
- id: separator_arrow
  type: Breadcrumb
  properties:
    separator: ">"
    list:
      - Home
      - Category
      - Sub-Category
      - Item
- id: separator_dash
  type: Breadcrumb
  properties:
    separator: "-"
    list:
      - Home
      - Settings
      - Profile
- id: separator_pipe
  type: Breadcrumb
  properties:
    separator: "|"
    list:
      - Documents
      - Projects
      - Reports
- id: separator_dot
  type: Breadcrumb
  properties:
    separator: ·
    list:
      - Overview
      - Details
      - Summary
```

```yaml
- id: links_url
  type: Breadcrumb
  properties:
    list:
      - label: Home
        url: https://lowdefy.com
      - label: Docs
        url: https://docs.lowdefy.com
      - label: Current Page
- id: links_page_id
  type: Breadcrumb
  properties:
    list:
      - label: Home
        pageId: introduction
      - label: Settings
        pageId: introduction
      - label: Profile
- id: links_mixed
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
        url: https://lowdefy.com
      - label: Projects
      - label: Settings
        pageId: introduction
      - label: General
```

```yaml
- id: icons_string
  type: Breadcrumb
  properties:
    list:
      - label: Home
        icon: AiOutlineHome
      - label: Users
        icon: AiOutlineUser
      - label: Profile
- id: icons_multiple
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
        icon: AiOutlineDashboard
      - label: Settings
        icon: AiOutlineSetting
      - label: Security
        icon: AiOutlineLock
- id: icons_files
  type: Breadcrumb
  properties:
    list:
      - label: Files
        icon: AiOutlineFolder
      - label: Documents
        icon: AiOutlineFile
      - label: report.pdf
- id: icons_custom_object
  type: Breadcrumb
  properties:
    list:
      - label: Admin
        icon:
          name: AiOutlineCrown
          color: "#faad14"
      - label: Console
        icon:
          name: AiOutlineCode
          color: "#1677ff"
      - label: Logs
```

```yaml
- id: styled_bold_last
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
      - label: Settings
      - label: Security
        style:
          fontWeight: bold
- id: styled_colored
  type: Breadcrumb
  properties:
    list:
      - label: Home
        style:
          color: "#1677ff"
      - label: Active
        style:
          color: "#52c41a"
          fontWeight: bold
      - label: Page
- id: styled_size
  type: Breadcrumb
  properties:
    list:
      - label: Root
        style:
          fontSize: 16
      - label: Child
        style:
          fontSize: 14
      - label: Leaf
        style:
          fontSize: 12
```

```yaml
- id: on_click_basic
  type: Breadcrumb
  properties:
    list:
      - Home
      - Products
      - Details
  events:
    onClick:
      - id: on_click_basic_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Clicked: "
              - _event: link
          status: info
- id: on_click_objects
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
      - label: Reports
      - label: Monthly
  events:
    onClick:
      - id: on_click_objects_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Navigating to item "
              - _event: index
          status: info
- id: on_click_set_state
  type: Breadcrumb
  properties:
    list:
      - label: Home
      - label: Settings
      - label: Profile
  events:
    onClick:
      - id: on_click_set_state_action
        type: SetState
        params:
          last_breadcrumb_click:
            _event: link
```

```yaml
- id: on_click_basic
  type: Breadcrumb
  properties:
    list:
      - Home
      - Products
      - Details
  events:
    onClick:
      - id: on_click_basic_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Clicked: "
              - _event: link
          status: info
- id: on_click_objects
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
      - label: Reports
      - label: Monthly
  events:
    onClick:
      - id: on_click_objects_msg
        type: DisplayMessage
        params:
          content:
            _string.concat:
              - "Navigating to item "
              - _event: index
          status: info
- id: on_click_set_state
  type: Breadcrumb
  properties:
    list:
      - label: Home
      - label: Settings
      - label: Profile
  events:
    onClick:
      - id: on_click_set_state_action
        type: SetState
        params:
          last_breadcrumb_click:
            _event: link
```

```yaml
- id: css_tailwind_bg
  type: Breadcrumb
  class: bg-bg-layout p-3 rounded-lg
  properties:
    list:
      - Home
      - Category
      - Item
- id: css_tailwind_shadow
  type: Breadcrumb
  class: shadow-md p-3 rounded-md
  properties:
    list:
      - Dashboard
      - Analytics
      - Reports
- id: css_inline_border
  type: Breadcrumb
  properties:
    list:
      - Dashboard
      - Analytics
      - Reports
  style:
    .element:
      padding: 8px 16px
      border: 1px solid
      borderRadius: 6
- id: css_inline_background
  type: Breadcrumb
  properties:
    list:
      - Home
      - Products
      - Checkout
  style:
    .element:
      padding: 10px 20px
      borderRadius: 8
```

```yaml
- id: theme_separator_style
  type: Breadcrumb
  properties:
    list:
      - Home
      - Products
      - Details
    theme:
      separatorColor: "#1677ff"
      separatorMargin: 12
- id: theme_link_colors
  type: Breadcrumb
  properties:
    list:
      - label: Dashboard
      - label: Settings
      - label: Profile
    theme:
      itemColor: "#722ed1"
      lastItemColor: "#f5222d"
      linkColor: "#722ed1"
      linkHoverColor: "#eb2f96"
- id: theme_icon_size
  type: Breadcrumb
  properties:
    list:
      - label: Home
        icon: AiOutlineHome
      - label: Users
        icon: AiOutlineTeam
      - label: Profile
    theme:
      iconFontSize: 20
- id: theme_combined
  type: Breadcrumb
  properties:
    separator: ">"
    list:
      - label: Home
        icon: AiOutlineHome
      - label: Projects
      - label: Current
    theme:
      itemColor: "#8c8c8c"
      lastItemColor: "#1677ff"
      separatorColor: "#bfbfbf"
      separatorMargin: 16
      iconFontSize: 16
```

**Two-Factor Authentication**

Add an extra layer of security to your account by enabling two-factor authentication.

```yaml
- id: settings_card
  type: Card
  properties:
    title: Account Settings
    size: small
  blocks:
    - id: settings_breadcrumb
      type: Breadcrumb
      properties:
        separator: ">"
        list:
          - label: Home
            icon: AiOutlineHome
            pageId: introduction
          - label: Settings
            icon: AiOutlineSetting
          - label: Security
            icon: AiOutlineLock
      events:
        onClick:
          - id: settings_click_msg
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Navigating to: "
                  - _event: link.label
              status: info
    - id: settings_divider
      type: Divider
    - id: settings_description
      type: Markdown
      properties:
        content: >
          **Two-Factor Authentication**


          Add an extra layer of security to your account by enabling two-factor
          authentication.
    - id: settings_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: settings_cancel_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Cancel
            color: default
            variant: outlined
          events:
            onClick:
              - id: settings_cancel_msg
                type: DisplayMessage
                params:
                  content: Changes discarded
                  status: info
        - id: settings_save_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Save Changes
            color: primary
            variant: solid
            icon: AiOutlineSave
          events:
            onClick:
              - id: settings_save_msg
                type: DisplayMessage
                params:
                  content: Settings saved successfully!
                  status: success
```

```yaml
- id: settings_card
  type: Card
  properties:
    title: Account Settings
    size: small
  blocks:
    - id: settings_breadcrumb
      type: Breadcrumb
      properties:
        separator: ">"
        list:
          - label: Home
            icon: AiOutlineHome
            pageId: introduction
          - label: Settings
            icon: AiOutlineSetting
          - label: Security
            icon: AiOutlineLock
      events:
        onClick:
          - id: settings_click_msg
            type: DisplayMessage
            params:
              content:
                _string.concat:
                  - "Navigating to: "
                  - _event: link.label
              status: info
    - id: settings_divider
      type: Divider
    - id: settings_description
      type: Markdown
      properties:
        content: >
          **Two-Factor Authentication**


          Add an extra layer of security to your account by enabling two-factor
          authentication.
    - id: settings_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: settings_cancel_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Cancel
            color: default
            variant: outlined
          events:
            onClick:
              - id: settings_cancel_msg
                type: DisplayMessage
                params:
                  content: Changes discarded
                  status: info
        - id: settings_save_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Save Changes
            color: primary
            variant: solid
            icon: AiOutlineSave
          events:
            onClick:
              - id: settings_save_msg
                type: DisplayMessage
                params:
                  content: Settings saved successfully!
                  status: success
```

**$249.99** ~~$329.99~~

Premium over-ear headphones with active noise cancellation, 30-hour battery life, and hi-res audio support. Available in Midnight Black and Pearl White.

```yaml
- id: ecommerce_breadcrumb
  type: Breadcrumb
  class: bg-bg-layout px-4 py-2 rounded-md
  properties:
    list:
      - label: Shop
        icon: AiOutlineHome
        url: https://lowdefy.com
      - label: Electronics
      - label: Audio
      - label: Wireless Headphones
        style:
          fontWeight: bold
    theme:
      lastItemColor: "#1677ff"
      separatorMargin: 10
- id: ecommerce_card
  type: Card
  properties:
    title: Wireless Noise-Cancelling Headphones
    size: small
  blocks:
    - id: ecommerce_description
      type: Markdown
      properties:
        content: >
          **$249.99** ~~$329.99~~


          Premium over-ear headphones with active noise cancellation, 30-hour
          battery life, and hi-res audio support. Available in Midnight Black
          and Pearl White.
    - id: ecommerce_actions
      type: Box
      layout:
        gap: 8
        justify: flex-start
      blocks:
        - id: ecommerce_cart_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Add to Cart
            color: primary
            variant: solid
            icon: AiOutlineShoppingCart
          events:
            onClick:
              - id: ecommerce_cart_msg
                type: DisplayMessage
                params:
                  content: Added to cart!
                  status: success
        - id: ecommerce_wishlist_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Wishlist
            color: default
            variant: outlined
            icon: AiOutlineHeart
          events:
            onClick:
              - id: ecommerce_wishlist_msg
                type: DisplayMessage
                params:
                  content: Added to wishlist
                  status: info
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `separator` | string | `"/"` | Use a custom separator string. |
| `list` | array | - | List of breadcrumb links. |
| `list.$.label` | string | - | Label of the breadcrumb link. |
| `list.$.pageId` | string | - | Page id to link to when clicked. |
| `list.$.url` | string | - | External url link. |
| `list.$.style` | object | - | Css style to apply to link. |
| `list.$.icon` | string \| object | - | Name of an React-Icon (See all icons) or properties of an Icon block to use an icon in breadcrumb link. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design breadcrumb tokens](https://ant.design/components/breadcrumb#design-token). |
| `theme.itemColor` | string | `"rgba(0, 0, 0, 0.45)"` | Text color of breadcrumb item. |
| `theme.iconFontSize` | number | `14` | Icon size of breadcrumb item. |
| `theme.linkColor` | string | `"rgba(0, 0, 0, 0.45)"` | Text color of link. |
| `theme.linkHoverColor` | string | `"rgba(0, 0, 0, 0.88)"` | Color of hovered link. |
| `theme.lastItemColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the last item. |
| `theme.separatorMargin` | number | `8` | Margin of separator. |
| `theme.separatorColor` | string | `"rgba(0, 0, 0, 0.45)"` | Color of separator. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | `{ link: object, index: integer }` | Triggered when breadcrumb item is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Breadcrumb element. |
| `/icon` | The icon in the Breadcrumb. |

No slots defined.
