<TITLE>_url_query</TITLE>
<METADATA>env: Client</METADATA>
<DESCRIPTION>The `_url_query` operator gets a value from the [`urlQuery`](/page-and-app-state) object. The `urlQuery` is a data object that is set as the [`https://en.wikipedia.org/wiki/Query_string`] of the app URL. It can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `input`, the `urlQuery` is visible to the user, and can be modified by the user.

If the page is reloaded, the `urlQuery` is not lost. By using `urlQuery`, you can make links containing data that can be shared by users. By default, `_url_query` accesses the `url_query` object from the [page](/page-and-app-state) the operator is used in.

`urlQuery` objects are serialized to JSON, allowing nested objects or arrays to be specified.</DESCRIPTION>
<USAGE>(key: string): any
(all: boolean): any
(arguments: {
all?: boolean,
key?: string,
default?: any,
}): any

###### string

If the `_url_query` operator is called with a string argument, the value of the key in the `urlQuery` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean

If the `_url_query` operator is called with boolean argument `true`, the entire `urlQuery` object is returned.

###### object

- `all: boolean`: If `all` is set to `true`, the entire `urlQuery` object is returned. One of `all` or `key` are required.
- `key: string`: The value of the key in the `urlQuery` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
- `default: any`: A value to return if the `key` is not found in `urlQuery`. By default, `null` is returned if a value is not found.</USAGE>
  <EXAMPLES>###### Get the value of `my_key` from `urlQuery`:

```yaml
_url_query: my_key
```

```yaml
_url_query:
  key: my_key
```

Returns: The value of `my_key` in `urlQuery`.

###### Get the entire `urlQuery` object:

```yaml
_url_query: true
```

```yaml
_url_query:
  all: true
```

Returns: The entire `urlQuery` object.

###### Dot notation:

Assuming urlQuery:

```yaml
my_object:
  subfield: 'Value'
```

then:

```yaml
_url_query: my_object.subfield
```

```yaml
_url_query:
  key: my_object.subfield
```

Returns: `"Value"`.

###### Return a default value if the value is not found:

```yaml
_url_query:
  key: might_not_exist
  default: Default value
```

Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:

Assuming `urlQuery`:

```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```

then:

```yaml
_url_query: my_array.$.value
```

Returns: `0` when used from the first block (0th index) in a list.</EXAMPLES>
