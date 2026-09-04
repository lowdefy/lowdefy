# _media

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_media` operator gets a value from the [`media`](/page-and-app-state) object. It can only be used on the web-client (Not in `requests` or `connections`). `media` is a data object that contains information about the current screen size of a users browser window. It contains the following data:


- `width: number`: The width of the window in pixels.
- `height: number`: The height of the window in pixels.
- `darkMode: boolean`: Whether dark mode is currently active. Resolves from the user's preference (`'dark'` → true, `'light'` → false, `'system'` → follows OS `prefers-color-scheme`).
- `darkModePreference: 'system' | 'light' | 'dark'`: The user's dark mode preference. `'system'` means the OS preference is being followed.
- `size: enum`: One of `xs`, `sm`, `md`, `lg`, `xl`, `2xl`. The sizes are determined by comparing the window width to the following breakpoints (in pixels):
  - `xs`: `width < 640px`
  - `sm`: `640px <= width < 768px`
  - `md`: `768px <= width < 1024px`
  - `lg`: `1024px <= width < 1280px`
  - `xl`: `1280px <= width < 1536px`
  - `2xl`: `1536px <= width`

> **Note:** In v4, the largest breakpoint was `xxl` (1600px). It has been renamed to `2xl` (1536px) to align with Tailwind CSS breakpoints. See the [Migration Guide](/v4-to-v5) for details.

#### Arguments

###### string
If the `_media` operator is called with a string argument, the value of the key in the `media` object is returned. If the value is not found, `null` is returned.

###### boolean
If the `_media` operator is called with boolean argument `true`, the entire `media` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `media` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `media` object is returned. Must be one of `size`, `width`, `height`, `darkMode` or `darkModePreference`. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `media`. By default, `null` is returned if a value is not found.

#### Examples

###### Get the value of `size` from `media`:
```yaml
_media: size
```
```yaml
_media:
  key: size
```
Returns: The value of `size`.

###### Get the entire `media` object:
```yaml
_media: true
```
```yaml
_media:
  all: true
```
Returns: The entire `media` object.

###### Check if dark mode is active:
```yaml
_media: darkMode
```
Returns: `true` or `false`.

###### Get the current dark mode preference:
```yaml
_media: darkModePreference
```
Returns: `'system'`, `'light'`, or `'dark'`.

###### Return a default value if the key is not found:
```yaml
_media:
  key: darkModePreference
  default: system
```
Returns: The value of `darkModePreference`, or `"system"` if `media` does not carry the key.
