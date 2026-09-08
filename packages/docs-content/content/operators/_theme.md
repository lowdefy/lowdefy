# _theme

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_theme` operator gets a value from the app's antd theme seed tokens, as configured in `theme.antd.token` in `lowdefy.yaml`. This is useful for accessing theme values in expressions, such as setting colors or sizes dynamically based on the app's theme.

> The `_theme` operator is **client-side only**. It accesses seed tokens only — for derived tokens (like hover/active color variants), use CSS variables instead: `var(--ant-color-primary-hover)`.

See the [Theming](/theming) concept page for details on configuring your app's theme.

#### Arguments

###### string
If the `_theme` operator is called with a string argument, the value of that token key from `theme.antd.token` is returned. If the token is not found, `null` is returned.

###### boolean
If the `_theme` operator is called with boolean argument `true`, the entire seed token object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire seed token object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the specified token is returned. If not found, `null` or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the token key is not found. By default, `null` is returned.

#### Examples

###### Get the primary color token:
```yaml
_theme: colorPrimary
```
Returns: `"#1677ff"` (or whatever `colorPrimary` is set to in your theme config).

###### Get a token with a default value:
```yaml
_theme:
  key: colorBgContainer
  default: '#ffffff'
```
Returns the value of `colorBgContainer` from the theme, or `"#ffffff"` if not set.

###### Get all seed tokens:
```yaml
_theme:
  all: true
```
Returns the entire `theme.antd.token` object.

###### Use in a block property:
```yaml
- id: my_paragraph
  type: Paragraph
  properties:
    content: The theme's primary color is set to...
  style:
    .element:
      color:
        _theme: colorPrimary
```
