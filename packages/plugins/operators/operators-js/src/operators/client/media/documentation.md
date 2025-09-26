<TITLE>
_media
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_media` operator gets a value from the [`media`](/page-and-app-state) object. It can only be used on the web-client (Not in `requests` or `connections`). `media` is a data object that contains information about the current screen size of a users browser window. It contains the following data:

- `width: number`: The width of the window in pixels.
- `height: number`: The height of the window in pixels.
- `size: enum`: One of `xs`, `sm`, `md`, `lg`, `xl`, `xxl`. The sizes are determined by comparing the window width to the following breakpoints (in pixels):
  - `xs`: `width < 576px`
  - `sm`: `576px <= width < 768px`
  - `md`: `768px <= width < 992px`
  - `lg`: `992px <= width < 1200px`
  - `xl`: `1200px <= width < 1600px`
  - `xxl`: `1600px <= width`
    </DESCRIPTION>

<USAGE>
```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

###### string

If the `_media` operator is called with a string argument, the value of the key in the `media` object is returned. If the value is not found, `null` is returned.

###### boolean

If the `_media` operator is called with boolean argument `true`, the entire `media` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `media` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `media` object is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `media`. By default, `null` is returned if a value is not found.
  </USAGE>

<EXAMPLES>
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

###### Return a default value if the value is not found:

```yaml
_media:
  key: does_not_exist
  default: Not there
```

Returns: `"Not there"`.
</EXAMPLES>
