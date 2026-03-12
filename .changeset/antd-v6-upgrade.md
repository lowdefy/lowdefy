---
'@lowdefy/blocks-antd': major
'@lowdefy/blocks-basic': major
'@lowdefy/blocks-loaders': major
'@lowdefy/blocks-echarts': major
'@lowdefy/blocks-markdown': major
'@lowdefy/blocks-aggrid': major
'@lowdefy/blocks-google-maps': major
'@lowdefy/blocks-algolia': major
'@lowdefy/blocks-qr': major
'@lowdefy/plugin-aws': major
'@lowdefy/api': major
'@lowdefy/block-utils': major
'@lowdefy/operators-js': major
'@lowdefy/client': major
'@lowdefy/server-dev': major
'@lowdefy/block-dev': major
'@lowdefy/e2e-utils': major
---

Upgrade all block components from antd v5 to v6.

### Breaking Changes

- **Less removed**: `styles.less` must be renamed to `styles.css` and converted to plain CSS. Less syntax (`@variables`, mixins, nesting) is no longer supported.
- **Theme variables replaced**: Less variables like `@primary-color` are replaced by `theme.antd.token` in `lowdefy.yaml`. Dark mode via `theme.antd.algorithm: dark` replaces `@import 'antd/dist/antd.dark.less'`.
- **`areas` renamed to `slots`**: The `areas` property is renamed to `slots`. `areas` still works at build time (auto-migrated with deprecation warning) but should be updated.
- **Comment block removed**: The Comment block is deleted (removed upstream in antd v5). Use a Card + Flex + Avatar composition instead.
- **`@lowdefy/blocks-color-selectors` package removed**: ColorSelector moved into `@lowdefy/blocks-antd`.

### Theme Token Mapping

| Less variable (v4)      | Theme token (v5)    |
| ----------------------- | ------------------- |
| `@primary-color`        | `colorPrimary`      |
| `@success-color`        | `colorSuccess`      |
| `@warning-color`        | `colorWarning`      |
| `@error-color`          | `colorError`        |
| `@font-size-base`       | `fontSize`          |
| `@border-radius-base`   | `borderRadius`      |
| `@text-color`           | `colorTextBase`     |
| `@heading-color`        | `colorTextHeading`  |
| `@disabled-color`       | `colorTextDisabled` |
| `@border-color-base`    | `colorBorder`       |
| `@body-background`      | `colorBgBase`       |
| `@component-background` | `colorBgContainer`  |

### `bordered` → `variant`

16 blocks replace the boolean `bordered` property with an enum `variant`:

- `bordered: true` (default) → `variant: outlined`
- `bordered: false` → `variant: borderless`
- New option: `variant: filled`

Affected blocks: AutoComplete, Card, Collapse, Descriptions, DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector, MultipleSelector, NumberInput, PasswordInput, PhoneNumberInput, Selector, TextArea, TextInput.

### Button `type`/`danger` → `color`/`variant`

| Old (v4)        | New (v5)                           |
| --------------- | ---------------------------------- |
| `type: primary` | `color: primary`, `variant: solid` |
| `type: dashed`  | `variant: dashed`                  |
| `type: text`    | `variant: text`                    |
| `type: link`    | `variant: link`                    |
| `danger: true`  | `color: danger`                    |

### Property Renames

| Block        | Old property            | New property                                  |
| ------------ | ----------------------- | --------------------------------------------- |
| Modal        | `visible`               | `open`                                        |
| Tooltip      | `defaultVisible`        | `defaultOpen`                                 |
| Tooltip      | event `onVisibleChange` | event `onOpenChange`                          |
| Progress     | `gapPosition`           | `gapPlacement`                                |
| Carousel     | `dotPosition`           | `dotPlacement`                                |
| Collapse     | `expandIconPosition`    | `expandIconPlacement`                         |
| Notification | `message`               | `title`                                       |
| Tabs         | `tabPosition`           | `tabPlacement`                                |
| Divider      | `type`                  | `orientation`                                 |
| Divider      | `orientation`           | `titlePlacement` (`start` / `center` / `end`) |

### Inline Style Props → `style: { --key }`

Block-specific inline style properties are replaced by unified `style` with `--` prefixed CSS slot keys:

| Block        | Removed properties                                                            | Use instead                                                 |
| ------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Card         | `headerStyle`, `bodyStyle`                                                    | `style: { --header }`, `style: { --body }`                  |
| Modal        | `bodyStyle`, `maskStyle`                                                      | `style: { --body }`, `style: { --mask }`                    |
| Drawer       | `drawerStyle`, `headerStyle`, `bodyStyle`, `maskStyle`, `contentWrapperStyle` | `style: { --wrapper, --header, --body, --mask, --content }` |
| Tabs         | `tabBarStyle`                                                                 | `style: { --tabBar }`                                       |
| ConfirmModal | `bodyStyle`                                                                   | `style: { --body }`                                         |
| Statistic    | `valueStyle`                                                                  | `style: { --value }`                                        |
| Descriptions | `contentStyle`, `labelStyle`                                                  | `style: { --content, --label }`                             |
| Tooltip      | `overlayStyle`                                                                | `style: { --inner }`                                        |

### New Blocks

FloatButton, Tour, QRCode, Watermark, ColorSelector, Flex, Splitter, ConfigProvider, Masonry, Avatar.Group.

### New Features

- **Theme token system**: `writeTheme.js` generates `theme.json` at build time, `_theme` operator provides runtime access to design tokens, ConfigProvider wraps the app.
- **Per-block theming**: `properties.theme` overrides antd design tokens for a single block via scoped ConfigProvider.
