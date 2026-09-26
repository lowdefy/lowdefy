# Icon

Display a Lucide icon by semantic name (`edit`), Lucide name (`Pencil`) or qualified name (`lucide:Pencil`), with per-icon size, colour and stroke width.

Lowdefy draws icons with [Lucide](https://lucide.dev): about 1,850 stroke icons on a 24px grid. The Icon block renders one icon. Every block property that takes an icon, such as `icon` on a Button or a menu link, takes the same names and the same settings.

## Icon names

An icon name has one of three forms:

| Form      | Example                          | Resolves to                                                                                              |
| --------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Semantic  | `edit`, `chevron-down`           | A built-in name for a common job, lowercase kebab-case. `edit` draws Lucide `Pencil`.                    |
| Set name  | `Pencil`, `Receipt`              | An icon in the app's default set (`theme.icons.set`, Lucide unless changed), then in Lucide. PascalCase. |
| Qualified | `lucide:Pencil`, `tabler:Pencil` | That icon in that set only. Use it to reach a set that is not the default.                               |

Use a semantic name when one fits. Blocks and Ant Design components use the same names for their own icons, so `theme.icons.aliases` or an [icon set](/plugins-icon-sets) restyles your icons and the built-in ones together. [Theming](/theming) lists every semantic name.

For anything else, use the Lucide name in PascalCase. Search [lucide.dev/icons](https://lucide.dev/icons), then write the name as the React component name: `circle-dollar-sign` on the site is `CircleDollarSign` in config. Lucide's older alias names, such as `Home` for `House`, also work.

In a running dev server, AI agents can find names with the `lowdefy_search_icons` tool (see [Docs for AI Agents](/ai-agent-docs)).

```yaml
- id: edit_icon
  type: Icon
  properties:
    name: edit # semantic
- id: invoice_icon
  type: Icon
  properties:
    name: Receipt # Lucide
- id: save_button
  type: Button
  properties:
    title: Save
    icon: save
```

An unknown icon name in config fails the build, with a suggestion. Old react-icons names such as `AiOutlineUser` fail too; see [V6 to V7](/v6-to-v7) to migrate them.

## Icon settings

Set these on the Icon block, or pass an object instead of a name to any `icon` property:

| Property           | Default | Description                                                                                    |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| `name`             |         | The icon name.                                                                                 |
| `size`             | `1em`   | Width and height. A number is pixels; a string is any CSS length. `1em` follows the font size. |
| `color`            |         | CSS colour. It colours stroke and fill icons alike.                                            |
| `strokeWidth`      | `2`     | Line width, in units of the icon's 24px grid.                                                  |
| `nonScalingStroke` | `false` | Keep the line width constant in screen pixels at any size.                                     |
| `rotate`           |         | Degrees to rotate the icon.                                                                    |
| `spin`             | `false` | Replace the icon with the spinning `loading` icon.                                             |
| `title`            |         | Hover text, read by screen readers.                                                            |

```yaml
- id: delete_button
  type: Button
  properties:
    title: Delete
    danger: true
    icon:
      name: delete
      strokeWidth: 1.5
- id: status_icon
  type: Icon
  properties:
    name: CircleCheckBig
    size: 32
    color: '#16a34a'
    nonScalingStroke: true
```

The defaults for `size`, `strokeWidth` and `nonScalingStroke` come from `theme.icons`, so one setting changes every icon in the app. A value on the icon wins over the theme.

## Titles

The Icon block adds a hover title made from the name: `Pencil` gives "Pencil", `ArrowLeftRight` gives "Arrow left right", and `more-vertical` gives "More vertical". A qualified name drops its set prefix. Set `title` to change it, or to an empty string for a decorative icon.

## Names only known at runtime

The build bundles only the icons your config names. A name that comes from state, a request or a database is not in the config, so list it under `theme.icons.include`:

```yaml
theme:
  icons:
    include:
      - Flag
      - Truck
```

```yaml
- id: semantic_add
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: add
    size: 24
- id: semantic_edit
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: edit
    size: 24
- id: semantic_delete
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: delete
    size: 24
- id: semantic_search
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: search
    size: 24
- id: semantic_settings
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: settings
    size: 24
- id: semantic_warning
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: warning
    size: 24
- id: semantic_info
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: info
    size: 24
- id: semantic_success
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: success
    size: 24
```

```yaml
- id: icon_home
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: home
    size: 24
- id: icon_search
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: search
    size: 24
- id: icon_user
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: user
    size: 24
- id: icon_setting
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: settings
    size: 24
- id: icon_bell
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: bell
    size: 24
- id: icon_heart
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 24
- id: icon_star
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: star
    size: 24
- id: icon_check
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: check
    size: 24
- id: icon_close
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: close
    size: 24
- id: icon_info
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: info
    size: 24
- id: icon_warning
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: warning
    size: 24
- id: icon_mail
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: mail
    size: 24
```

```yaml
- id: size_16
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Rocket
    size: 16
- id: size_24
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Rocket
    size: 24
- id: size_32
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Rocket
    size: 32
- id: size_48
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Rocket
    size: 48
- id: size_64
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Rocket
    size: 64
```

```yaml
- id: color_red
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: red
- id: color_blue
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: blue
- id: color_green
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: green
- id: color_orange
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: orange
- id: color_purple
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: purple
- id: color_tomato
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: tomato
- id: color_teal
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: teal
- id: color_coral
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    color: coral
```

```yaml
- id: hex_blue
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#1677ff"
- id: hex_green
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#52c41a"
- id: hex_red
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#f5222d"
- id: hex_orange
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#fa8c16"
- id: hex_purple
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#722ed1"
- id: hex_cyan
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#13c2c2"
- id: hex_coral
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#ff6b6b"
- id: hex_indigo
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#4c6ef5"
- id: hex_pink
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#e64980"
- id: hex_amber
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: Zap
    size: 40
    color: "#fab005"
```

```yaml
- id: spin_loading
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: loading
    size: 32
    spin: true
    color: "#1677ff"
- id: spin_loading3q
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: loading
    size: 32
    spin: true
    color: "#52c41a"
- id: spin_sync
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: RefreshCw
    size: 32
    spin: true
    color: "#fa8c16"
- id: spin_setting
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: settings
    size: 32
    spin: true
    color: "#722ed1"
- id: spin_reload
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: refresh
    size: 32
    spin: true
    color: "#f5222d"
```

```yaml
- id: rotate_0
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 0
    color: "#1677ff"
- id: rotate_45
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 45
    color: "#1677ff"
- id: rotate_90
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 90
    color: "#1677ff"
- id: rotate_135
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 135
    color: "#1677ff"
- id: rotate_180
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 180
    color: "#1677ff"
- id: rotate_270
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: arrow-up
    size: 32
    rotate: 270
    color: "#1677ff"
```

```yaml
- id: stroke_width_1
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    strokeWidth: 1
- id: stroke_width_2
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    strokeWidth: 2
- id: stroke_width_3
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 32
    strokeWidth: 3
- id: non_scaling_stroke
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: heart
    size: 64
    nonScalingStroke: true
```

```yaml
- id: title_info
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: info
    size: 32
    color: "#1677ff"
    title: More information
- id: title_warning
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: warning
    size: 32
    color: "#faad14"
    title: Warning - proceed with caution
- id: title_help
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: help
    size: 32
    color: "#722ed1"
    title: Click for help
```

```yaml
- id: dark_bg_blue
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#1a1a2e"
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: dark_icon_blue
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: Cloud
        size: 40
        color: "#69b1ff"
- id: dark_bg_green
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#0d2818"
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: dark_icon_green
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: check-circle
        size: 40
        color: "#95de64"
- id: dark_bg_red
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#2a1215"
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: dark_icon_red
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: close-circle
        size: 40
        color: "#ff7875"
- id: dark_bg_purple
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#1a0a2e"
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: dark_icon_purple
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: star
        size: 40
        color: "#b37feb"
```

```yaml
- id: colored_bg_success
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#f6ffed"
      border: 1px solid
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: colored_icon_success
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: check-circle
        size: 36
        color: "#52c41a"
- id: colored_bg_warning
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#fffbe6"
      border: 1px solid
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: colored_icon_warning
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: CircleAlert
        size: 36
        color: "#faad14"
- id: colored_bg_error
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#fff2f0"
      border: 1px solid
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: colored_icon_error
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: close-circle
        size: 36
        color: "#ff4d4f"
- id: colored_bg_info
  type: Box
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#e6f4ff"
      border: 1px solid
      padding: 16
      borderRadius: 8
      display: flex
      alignItems: center
      justifyContent: center
  blocks:
    - id: colored_icon_info
      type: Icon
      layout:
        flex: 0 0 auto
      properties:
        name: info
        size: 36
        color: "#1677ff"
```

```yaml
- id: style_padded
  type: Icon
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#f0f5ff"
      padding: 12
      borderRadius: 50%
  properties:
    name: user
    size: 32
    color: "#1677ff"
- id: style_bordered
  type: Icon
  layout:
    flex: 0 0 auto
  style:
    .element:
      border: 2px solid
      padding: 10
      borderRadius: 8
  properties:
    name: settings
    size: 28
    color: "#595959"
- id: style_shadow
  type: Icon
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#ffffff"
      padding: 14
      borderRadius: 12
      boxShadow: 0 2px 8px rgba(0, 0, 0, 0.15)
  properties:
    name: bell
    size: 30
    color: "#fa8c16"
- id: style_gradient_bg
  type: Icon
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: linear-gradient(135deg,
      padding: 14
      borderRadius: 12
  properties:
    name: Zap
    size: 30
    color: "#ffffff"
- id: style_circle_bg
  type: Icon
  layout:
    flex: 0 0 auto
  style:
    .element:
      background: "#ff4d4f"
      padding: 12
      borderRadius: 50%
      display: flex
      alignItems: center
      justifyContent: center
  properties:
    name: heart
    size: 24
    color: "#ffffff"
```

**disableLoadingIcon: false (default):**

**disableLoadingIcon: true:**

```yaml
- id: disable_loading_false_label
  type: Markdown
  properties:
    content: "**disableLoadingIcon: false (default):**"
- id: disable_loading_default
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: edit
    size: 32
    color: "#1677ff"
    disableLoadingIcon: false
- id: disable_loading_true_label
  type: Markdown
  properties:
    content: "**disableLoadingIcon: true:**"
- id: disable_loading_true
  type: Icon
  layout:
    flex: 0 0 auto
  properties:
    name: edit
    size: 32
    color: "#1677ff"
    disableLoadingIcon: true
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | string | - | Primary icon color. |
| `name` | string | - | Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`. Add your own semantic names with `theme.icons.aliases`. |
| `nonScalingStroke` | boolean | - | Keep the stroke width constant at any icon size. Defaults to `theme.icons.nonScalingStroke`. |
| `rotate` | number | - | Number of degrees to rotate the icon. |
| `size` | string \| number | - | Size of the icon. |
| `strokeWidth` | number | - | Stroke width of the icon lines, in pixels of the 24px icon grid. Defaults to `theme.icons.strokeWidth` (2). |
| `spin` | boolean | `false` | Continuously spin icon with animation. |
| `title` | string | - | Icon hover title for accessibility. |
| `disableLoadingIcon` | boolean | `false` | While loading after the icon has been clicked, don't render the loading icon. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Trigger actions when icon is clicked. The icon then takes keyboard focus, and Enter or Space trigger it too. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The Icon element. |

No slots defined.
