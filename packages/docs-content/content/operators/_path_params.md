# _path_params

```
(key: string): string
(all: boolean): object
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_path_params` operator gets a value from the page's path parameters: the values of the placeholders in the page's [`path`](/page-paths). On a page with `path: tickets/{space}/{ticket_id}`, opened at `/tickets/support/1234`, the path parameters are `{ space: 'support', ticket_id: '1234' }`.

Path parameters are set when linking to the page with `pathParams`, for example with the [`Link`](/Link) action, or by typing the URL. Unlike `input`, they are visible to the user and can be changed by the user.

> __DO NOT__ set any private or personal information in path parameters; all values in the URL are accessible publicly. Using a value that can be guessed, like an incremental `id`, can lead to security issues, since users can easily guess and access data for other `ids`.

Values are always strings, the text from the URL after decoding: `1234` is `"1234"`, and nothing is deserialized. Convert a value when you need another type, for example with [`_number.parseInt`](/_number). A page without placeholders has no path parameters, so `_path_params: true` returns `{}`.

Path parameters are kept apart from the [`urlQuery`](/_url_query): a page can have a `space` placeholder and a `space` query value, and `_path_params` only reads the placeholder. Within one [page instance](/page-paths#page-instances) the values never change, since different values open a different instance.

`_path_params` is only available in the browser. To use a value in a request, pass it in the request `payload`.

#### Arguments

###### string
If the `_path_params` operator is called with a string argument, the value of that placeholder is returned. If the page has no such placeholder, `null` is returned.

###### boolean
If the `_path_params` operator is called with boolean argument `true`, the object of all path parameters is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the object of all path parameters is returned. One of `all` or `key` are required.
  - `key: string`: The name of the placeholder whose value is returned. If the page has no such placeholder, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the page has no placeholder named `key`. By default, `null` is returned.

#### Examples

###### Get the value of the `ticket_id` placeholder:
On a page with `path: tickets/{space}/{ticket_id}`, opened at `/tickets/support/1234`:
```yaml
_path_params: ticket_id
```
```yaml
_path_params:
  key: ticket_id
```
Returns: `"1234"`.

###### Get all path parameters:
```yaml
_path_params: true
```
```yaml
_path_params:
  all: true
```
Returns: `{ space: 'support', ticket_id: '1234' }`.

###### Return a default value if the page has no such placeholder:
```yaml
_path_params:
  key: space
  default: general
```
Returns: The value of `space`, or `"general"` on a page whose path has no `{space}` placeholder.

###### Pass a value to a request:
```yaml
requests:
  - id: get_ticket
    type: MongoDBFindOne
    connectionId: tickets
    payload:
      ticket_id:
        _path_params: ticket_id
    properties:
      query:
        _id:
          _payload: ticket_id
```
