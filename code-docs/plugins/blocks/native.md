# @lowdefy/blocks-native

The native block set (`packages/plugins/blocks/blocks-native`): React Native components that the
shell renders mobile pages with, through `@lowdefy/client-native`. A native block takes the web
block's type name, properties, events, methods and value type; phone-only properties sit beside
them, and web properties a phone cannot honour stay in the schema with a description that says
they are ignored on mobile, so a shared page passes both schemas.

## Shape

- `src/blocks/<Block>/<Block>.js` is the component, with `.meta` set from `meta.js`, as web blocks
  carry their meta. `src/blocks.js` exports the components, `src/metas.js` the metas,
  `src/types.js` the type names for the build.
- Blocks read the theme with `useTheme()` from `@lowdefy/client-native`, through
  `shared/useBlockTokens.js`, which lays a block's own `properties.theme` over the computed antd
  tokens. A block draws its defaults and tokens first and its `styles.<slot>` over them, so
  classes and `style` win.
- Inputs draw `blocks/Label/Label.js`: title, `required` mark, colon (inline only), the `extra`
  text, and the first validation message once the engine shows validation. `getLabelState` holds
  the rules, which follow the web Label's `labelLogic`.
- The input box (`shared/getInputBoxStyle.js`) follows `variant`, `bordered: false`, `size` and
  the validation status. Sizes are one antd step taller than the web (`getControlSize`): a phone
  is touched, not clicked.
- Controls come from `@expo/ui` (a peer dependency the shell carries): `Picker` (Selector),
  `Switch`, and the community `DateTimePicker` (DateSelector). Picker and Switch sit in a
  `Host` seeded with the theme's primary colour and mode.

## Block notes

| Block          | Notes                                                                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextInput`    | `type` picks the keyboard (`getKeyboardProps`); `replaceInput`, `allowClear`, `showCount`, `prefix`/`suffix` as on the web.                                                                                                                   |
| `NumberInput`  | Keeps its own text so "-" and "1." can be typed; sets a number on each valid change; clamps to `min`/`max` and rounds to `precision` on blur; `mode: spinner` shows step buttons.                                                             |
| `Selector`     | The picker works on option indices, so option values may be any type (matched by stable serialization, as the web). A placeholder item stands for no value. Disabled options are left out.                                                    |
| `DateSelector` | The value is the picked day at midnight UTC, as the web. Shows the calendar under the field on iOS and Material's dialog on Android. Only `disabledDates.min`/`max` are supported.                                                            |
| `List`         | Web model and methods; `FlatList`, or `SectionList` with `sectionKey`. Scrolls itself only with `scroll: true`, since it sits in the page's scroll view. `swipeActions` use a `PanResponder` row (`SwipeableRow`) with accessibility actions. |
| `ListItem`     | Mobile only. A cell with avatar or icon, title, description, `extra` detail and a chevron that shows by default when it has `onClick`.                                                                                                        |
| `Button`       | `getButtonColors` follows antd: `color` + `variant`, or the deprecated `type` (where a preset colour has no effect and a custom colour replaces primary). The spinner comes from `events.onClick.loading`.                                    |

Icons (`Button.icon`, `ListItem.icon`) render through `components.Icon`, as on the web; the native
renderer provides it with the native `Icon` block.

## Tests

Jest runs under `@react-native/jest-preset`, as `client-native`'s tests do. `src/test/renderPage.js`
renders a build-shaped page with the real renderer, engine, actions and operators, so a test types,
picks and validates as a person would. `@expo/ui` is mapped to stand-ins in `src/test/` that keep
the props the blocks pass; a test fires their callbacks with `fireEvent(view, 'valueChange', ...)`.

`packages/shell/fixtures/formPage.test.js` builds the `fixtures/form` app with `@lowdefy/build` in a
child process and renders its page with these blocks: the build check that a form page of the
native set builds and renders. It lives in the shell because `@lowdefy/build` depends on this
package.
