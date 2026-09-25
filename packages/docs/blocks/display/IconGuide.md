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
