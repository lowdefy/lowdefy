# QRCode

QR code generator with customizable size, color, and error level.

```yaml
- id: qr_basic_url
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
- id: qr_basic_text
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: Hello, World!
- id: qr_basic_long_url
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://docs.lowdefy.com/tutorial-start
```

```yaml
- id: qr_size_small
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 80
- id: qr_size_default
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 160
- id: qr_size_large
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 240
```

```yaml
- id: qr_color_default
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
- id: qr_color_blue
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#1677ff"
- id: qr_color_green
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#52c41a"
- id: qr_color_purple
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#722ed1"
```

```yaml
- id: qr_bg_light_blue
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#1677ff"
    bgColor: "#e6f4ff"
- id: qr_bg_light_green
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#135200"
    bgColor: "#d9f7be"
- id: qr_bg_dark_navy
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    color: "#ffffff"
    bgColor: "#001529"
- id: qr_bg_transparent
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    bgColor: transparent
```

```yaml
- id: qr_ec_low
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    errorLevel: L
- id: qr_ec_medium
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    errorLevel: M
- id: qr_ec_quartile
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    errorLevel: Q
- id: qr_ec_high
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    errorLevel: H
```

```yaml
- id: qr_icon_small
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 200
    errorLevel: H
    icon: https://lowdefy.com/favicon-32x32.png
    iconSize: 24
- id: qr_icon_default
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 200
    errorLevel: H
    icon: https://lowdefy.com/favicon-32x32.png
    iconSize: 40
- id: qr_icon_large
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    size: 200
    errorLevel: H
    icon: https://lowdefy.com/favicon-32x32.png
    iconSize: 48
```

```yaml
- id: qr_bordered_true
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    bordered: true
- id: qr_bordered_false
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    bordered: false
- id: qr_bordered_colored
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    bordered: true
    color: "#1677ff"
    bgColor: "#e6f4ff"
```

```yaml
- id: qr_status_active
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    status: active
- id: qr_status_expired
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    status: expired
- id: qr_status_loading
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    status: loading
- id: qr_status_scanned
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    status: scanned
```

```yaml
- id: qr_type_canvas
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    type: canvas
- id: qr_type_svg
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    type: svg
```

```yaml
- id: qr_margin_0
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    marginSize: 0
    bordered: true
- id: qr_margin_2
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    marginSize: 2
    bordered: true
- id: qr_margin_6
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    marginSize: 6
    bordered: true
```

```yaml
- id: qr_version_1
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    minVersion: 1
- id: qr_version_5
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    minVersion: 5
- id: qr_version_10
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    minVersion: 10
```

```yaml
- id: qr_css_shadow
  type: QRCode
  layout:
    flex: 0 0 auto
  class: shadow-lg
  properties:
    value: https://lowdefy.com
- id: qr_css_rounded
  type: QRCode
  layout:
    flex: 0 0 auto
  class: shadow-xl rounded-2xl overflow-hidden
  properties:
    value: https://lowdefy.com
    color: "#1677ff"
    bgColor: "#f0f5ff"
- id: qr_css_inline_border
  type: QRCode
  layout:
    flex: 0 0 auto
  style:
    .element:
      borderColor: "#1677ff"
      borderWidth: 2
  properties:
    value: https://lowdefy.com
    bordered: true
- id: qr_css_inline_shadow
  type: QRCode
  layout:
    flex: 0 0 auto
  style:
    .element:
      boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15)
      borderRadius: 16
  properties:
    value: https://lowdefy.com
```

```yaml
- id: qr_theme_radius
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    theme:
      borderRadiusLG: 24
- id: qr_theme_container
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    theme:
      colorSplit: "#1677ff"
- id: qr_theme_padding
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    theme:
      padding: 24
      borderRadiusLG: 16
- id: qr_theme_cover
  type: QRCode
  layout:
    flex: 0 0 auto
  properties:
    value: https://lowdefy.com
    status: expired
    theme:
      QRCodeCoverBackgroundColor: rgba(0, 0, 0, 0.8)
      QRCodeTextColor: "#ffffff"
```

Present this QR code at the entrance for check-in.

```yaml
- id: ticket_card
  type: Card
  layout:
    flex: 0 0 380px
  properties:
    title: Tech Conference 2026
    size: small
  blocks:
    - id: ticket_details
      type: Descriptions
      properties:
        size: small
        column: 1
        items:
          - label: Date
            value: March 28, 2026
          - label: Venue
            value: Convention Center, Hall B
          - label: Ticket
            value: "General Admission #4821"
    - id: ticket_qr_row
      type: Box
      layout:
        align: center
        gap: 8
      blocks:
        - id: ticket_qr
          type: QRCode
          layout:
            flex: 0 0 auto
          properties:
            value: TICKET:CONF2026:GA:4821:VALID
            size: 180
            errorLevel: H
            bordered: false
        - id: ticket_hint
          type: Paragraph
          properties:
            content: Present this QR code at the entrance for check-in.
            type: secondary
```

```yaml
- id: wifi_card
  type: Card
  layout:
    flex: 0 0 340px
  properties:
    title: Guest Wi-Fi
    size: small
  blocks:
    - id: wifi_qr_row
      type: Box
      layout:
        align: center
        gap: 8
      blocks:
        - id: wifi_qr
          type: QRCode
          layout:
            flex: 0 0 auto
          properties:
            value: WIFI:T:WPA;S:OfficeGuest;P:welcome2026;;
            size: 200
            color: "#1677ff"
            bgColor: "#e6f4ff"
            errorLevel: Q
            bordered: false
    - id: wifi_details
      type: Descriptions
      properties:
        size: small
        column: 1
        items:
          - label: Network
            value: OfficeGuest
          - label: Password
            value: welcome2026
    - id: wifi_actions
      type: Box
      layout:
        gap: 8
        justify: flex-end
      blocks:
        - id: wifi_refresh_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Generate New Password
            color: primary
            variant: outlined
            icon: AiOutlineReload
          events:
            onClick:
              - id: wifi_refresh_msg
                type: DisplayMessage
                params:
                  content: New Wi-Fi password generated.
                  status: success
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | string | - | Scanned text. |
| `size` | integer | `160` | QRCode size in pixels. |
| `color` | string | `"#000000"` | QRCode color. |
| `bgColor` | string | `"transparent"` | QRCode background color. |
| `errorLevel` | string | `"M"` | Error correction level. Enum: `L`, `M`, `Q`, `H`. |
| `icon` | string | - | Icon URL in the center of the QR code. |
| `iconSize` | integer | `40` | Icon size in pixels. |
| `marginSize` | number | `0` | Margin size of the QR code in modules. |
| `minVersion` | integer | `1` | Minimum QR code version (1-40). Higher versions support more data. |
| `type` | string | `"canvas"` | Render type. Enum: `canvas`, `svg`. |
| `bordered` | boolean | `true` | Whether has border style. |
| `status` | string | `"active"` | QRCode status. Enum: `active`, `expired`, `loading`, `scanned`. |
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design qr-code tokens](https://ant.design/components/qr-code#design-token). |
| `theme.QRCodeTextColor` | string | - | Text color displayed on the QR code overlay. |
| `theme.QRCodeCoverBackgroundColor` | string | - | Background color of the cover overlay shown when expired, loading, or scanned. |
| `theme.borderRadiusLG` | number | `8` | Border radius of the QR code container. |
| `theme.colorText` | string | - | Text color. |
| `theme.colorBgContainer` | string | - | Background color of the QR code container. |
| `theme.colorSplit` | string | - | Border color when bordered is true. |
| `theme.lineWidth` | number | `1` | Border width. |
| `theme.padding` | number | `12` | Padding inside the QR code container. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onRefresh` | \- | Trigger action when expired QR code refresh button is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The QRCode element. |

No slots defined.
