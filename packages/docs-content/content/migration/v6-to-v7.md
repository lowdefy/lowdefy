# Version 6 to Version 7

This guide covers the icon changes when upgrading from Lowdefy v6 to v7. For the new auth system, see [Auth Upgrade](/auth-upgrade).

Lowdefy v7 draws every icon with [Lucide](https://lucide.dev) instead of [react-icons](https://react-icons.github.io/react-icons/). Icon names change from react-icons names (`AiOutlineDelete`) to semantic names (`delete`) and Lucide names (`Trash`). Blocks and Ant Design components draw Lucide icons too, so an app has one icon style.

## Summary of breaking changes

| Change                                         | Impact                                 | Action                                                                   |
| ---------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| react-icons names are not built in             | Almost every app                       | Run `lowdefy upgrade`, or install the compatibility set                  |
| An unknown icon name fails the build           | Apps with old or misspelled names      | Fix the name the error names                                             |
| `_operator` names read at runtime need a list  | Apps with a runtime `_operator` name   | List the operators it may call in `operators`                            |
| Dynamic blocks render only written blocks      | Apps returning stored blocks as data   | Use a policy with `ValidateDynamic`                                      |
| Block and Ant Design icons are Lucide          | All apps                               | None; check screens that depend on the old look                          |
| `theme.icons.aliases` targets are Lucide names | Apps with aliases                      | Drop the `Lu` prefix: `LuReceipt` becomes `Receipt`                      |
| Icon hover titles come from the new names      | Apps that show Icon block hover titles | Set `title` where the text matters                                       |
| `react-icons` is not a server dependency       | Plugins that import `react-icons`      | Render `components.Icon` with a name, or add `react-icons` to the plugin |
| `ClickableHtml` fires only listed data events  | Apps that use `data-event`             | Run `lowdefy upgrade`, or list the events in `dataEvents`                |

## Icon names

An icon name has one of three forms:

- **Semantic:** `edit`, `delete`, `chevron-down`. Built-in names for common jobs. [Theming](/theming) lists them all.
- **Lucide:** `Pencil`, `CreditCard`. The PascalCase name from [lucide.dev/icons](https://lucide.dev/icons).
- **Qualified:** `lucide:Pencil`. A name in a named [icon set](/plugins-icon-sets).

```yaml
# v6
- id: delete_button
  type: Button
  properties:
    title: Delete
    icon: AiOutlineDelete
- id: card_icon
  type: Icon
  properties:
    name: AiOutlineCreditCard

# v7
- id: delete_button
  type: Button
  properties:
    title: Delete
    icon: delete
- id: card_icon
  type: Icon
  properties:
    name: CreditCard
```

## Run the codemod

```bash
npx lowdefy upgrade
```

The v7 phase includes the `react-icons-to-lucide` codemod. It rewrites icon names as text, so it reaches:

- YAML, Nunjucks (`.njk`) and JSON config
- single-quoted names in `_js` code
- string literals and `meta.icons` in local plugin code
- `theme.icons.aliases` targets

Each old name maps to a semantic name where one fits, otherwise to a Lucide name. `Lu*` names drop the prefix (`LuPencil` becomes `Pencil`). The table lives in `@lowdefy/codemods` at `v7-0-0/react-icons-to-lucide.json`, and the build uses the same table for its error suggestions.

The codemod reports what it cannot decide for you:

- **Judgement calls**, where the closest Lucide glyph differs from the old one.
- **Known losses**: filled variants (`AiFillStar`), brand icons such as WhatsApp, and Word and PDF file glyphs. Lucide has no equivalents.
- **Runtime icon names**: icon properties set from `_state`, `_payload` or `_request`. The codemod does not change data. Use the compatibility set for names stored in a database.

## Build errors for old names

A literal icon name at an icon property that resolves to nothing fails the build. An old react-icons name gets a migration message:

```
Icon "AiOutlineDelete" is a react-icons name. Lowdefy 7 uses Lucide icons.
Use "delete" (or "Trash"). To keep react-icons names, install @lowdefy/icons-react-icons
and set theme.icons.set: react-icons. Run `lowdefy upgrade` to migrate names automatically.
```

Old Ant Design names such as `HomeOutlined` get the same message, pointing at their semantic name. In v6 these names drew nothing, so the error may show icons that were missing all along.

An icon property is a key ending in `icon` (`icon`, `prefixIcon`, `suffixIcon`, ...), its `name` field, the Icon block's `name`, a `data-icon` attribute in HTML, and `theme.icons.aliases` and `theme.icons.include`. Names inside an operator are bundled but not checked. An unknown name that reaches the page at runtime draws a red `icon-missing` icon.

## Keep old names: the compatibility set

`@lowdefy/icons-react-icons` holds every react-icons 5.6.0 icon under its old name. Install it to keep old names working without edits, or for names stored in data:

```yaml
plugins:
  - name: '@lowdefy/icons-react-icons'
    version: '^7'
theme:
  icons:
    set: react-icons
```

Old names then resolve in the compatibility set, and semantic and Lucide names still work. Block and Ant Design icons stay Lucide. Without `set: react-icons`, reach an old name with its qualified name: `react-icons:FaWhatsapp`. See [Icon Sets](/plugins-icon-sets).

## Visual changes

- **Block icons are Lucide.** Date picker calendars, input validation marks, selector arrows, the loading spinner, menu toggles and the dark mode toggle all use semantic names and draw Lucide icons.
- **Ant Design icons are Lucide.** Close buttons on modals, drawers, tags and alerts, alert and message status icons, collapse and menu arrows, pagination arrows, and button spinners use the same semantic names. Spin, Progress, QRCode, the Empty and Result illustrations, and the date picker panel arrows stay as Ant Design draws them.
- **Stroke width is a setting.** Lucide draws a 2px line on a 24px grid. Set `theme.icons.strokeWidth: 1.5` for a lighter look closer to Ant Design outline icons, or set `strokeWidth` on one icon.
- **Size is unchanged.** Icons default to `1em`, as before. Change it with `theme.icons.size`.
- **`color` and `rotate` go through CSS.** `color` colours stroke and fill icons alike, and `rotate` now turns the icon.
- **Hover titles change.** The Icon block's title comes from the name: `Pencil` gives "Pencil", and `more-vertical` gives "More vertical". Old names in the compatibility set give titles such as "Ai outline user". Set `title` where the text matters, or `title: ''` for none.
- **Icons without a title are hidden from screen readers** (`aria-hidden`).

## `theme.icons`

`theme.icons.aliases` targets are now Lucide or qualified names. The codemod rewrites them:

```yaml
# v6
theme:
  icons:
    aliases:
      invoice: LuReceipt
    include:
      - LuFlag

# v7
theme:
  icons:
    aliases:
      invoice: Receipt
    include:
      - Flag
```

`theme.icons` also has new keys: `set`, `size`, `strokeWidth` and `nonScalingStroke`. See [Theming](/theming).

## `_operator` names read at runtime

An `_operator` whose `name` is read at runtime (from state, a request, a payload or `__args`) must list the operators it may call in `operators`, or the build fails. The build loads exactly those operators with the page, so the call works on a direct page load, and `_operator` refuses any other name. A literal `name`, and the literal branches an `_if` or `_switch` returns, need no list.

```yaml
# v6
_operator:
  name:
    _state: aggregation
  params:
    _state: values

# v7
_operator:
  name:
    _state: aggregation
  operators:
    - _sum
    - _product
  params:
    _state: values
```

## Blocks returned as data by a Dynamic endpoint

A `Dynamic` block without a dynamic blocks policy renders only the blocks and actions its endpoint writes in its `:return` config. Block config the endpoint reads as data (a database record, routine state, a nested endpoint's result) and returns as it is now renders the block's fallback, even when it holds no operators. Data can still fill values in written blocks, for example by mapping stored fields into blocks with `_array.map`.

To render stored or generated block config, declare a [dynamic blocks policy](/dynamic-page-content#dynamic-blocks-policies) that lists what the content may use, put it on the `Dynamic` block, and return the content through a `ValidateDynamic` step with the same policy:

```yaml
- id: check
  type: ValidateDynamic
  properties:
    policy: stored_content
    blocks:
      _step: get_record.blocks
- :return:
    blocks:
      _step: check.blocks
```

## Plugins

Blocks no longer import icons from `react-icons` or `@ant-design/icons`, and the Lowdefy server no longer installs `react-icons`. A local block plugin should render icons by name with `components.Icon`, and list the names it uses in its `meta.icons`, so apps can restyle them:

```js
// v6
import { AiOutlineDelete } from 'react-icons/ai';
<AiOutlineDelete />;

// v7
<components.Icon blockId={`${blockId}_delete`} events={events} properties="delete" />;
```

A plugin that must keep importing `react-icons` adds it to its own `dependencies`.

## Auth links and client addresses

These changes affect apps with auth. See [Auth Upgrade](/auth-upgrade), [Auth configuration](/auth-configuration) and [Deploy with Docker](/docker#behind-a-reverse-proxy).

- **Pinned auth URL.** With `auth.email` configured, the production server refuses to start unless `BETTER_AUTH_URL` or the current environment's `url` in `config.environments` is set, so emailed auth links cannot take their host from a request. The dev server is unchanged.
- **Client address.** The server takes the client address for auth rate limits, sessions and request logs from the connection, and reads `X-Forwarded-For` only from the proxies listed in `config.trustedProxies`. Behind a reverse proxy or load balancer, list it there; otherwise every client shares the proxy's rate limits. On Vercel nothing changes.
- **Email link pages.** `SignUp` and `SendVerificationEmail` without a `callbackUrl` send the verification link to `auth.authPages.verifyEmail` (default `/verify-email`), not the home page. `RequestPasswordReset` without `redirectTo` sends the reset link to `auth.authPages.resetPassword` (default `/reset-password`). The build warns when the app sends these emails and the page does not exist.

## `ClickableHtml` data events

A `ClickableHtml` block now fires only the events its `dataEvents` property lists. A `data-event` whose name is not listed does nothing and logs a console warning, and a block without `dataEvents` fires no events from its HTML. HTML is often built from request or user data, and sanitising keeps `data-*` attributes, so in v6 markup inside that data could fire any event the block declared.

```yaml
# v6
- id: rows
  type: ClickableHtml
  properties:
    html: '<i data-icon="delete" data-event="onDelete" data-id="42" data-confirm="Delete?"></i>'

# v7
- id: rows
  type: ClickableHtml
  properties:
    dataEvents:
      - name: onDelete
        confirm: true
    html: '<i data-icon="delete" data-event="onDelete" data-id="42" data-confirm="Delete?"></i>'
```

An entry is an event name, or `{ name, confirm }`: with `confirm`, every click on the event asks first, whatever the markup says. The `clickable-html-data-events` codemod in `lowdefy upgrade` adds `dataEvents` to each block and reports HTML built from data that inserts values without escaping them. It only reaches the app's files: add `dataEvents` yourself to `ClickableHtml` blocks that [dynamic page content](/dynamic-page-content) builds at page load, for example from config stored in a database. See [HTML attributes](/html-attributes).
