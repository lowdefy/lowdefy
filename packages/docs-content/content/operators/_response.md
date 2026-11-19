# _response

```
(key: string): any
(key: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

The `_response` operator gets a value from what the routine of an MCP tool returned. It is used to build the address of the tool's [view](/mcp-oauth): the page an MCP host such as Claude shows when it calls the tool.

`_response` can only be used in the `pathParams` and `urlQuery` of a `view` on an `mcp.endpoints` entry. The build refuses it anywhere else. Use `_payload` in the same places for the arguments the tool was called with.

The response is whatever the endpoint's routine returned with `:return`. `_response` reads it the way `_payload` reads the payload: a string gets a key, with dot notation and array indexes for nested values, and `true` gets the whole response. A key that is not in the response gives `null`.

The address is sent to the MCP client, so a `view` allows only a short list of other operators beside `_payload` and `_response`. The [MCP page](/mcp-oauth) lists them. When a path value comes out empty, the tool still answers with its text result and no view opens.

#### Arguments

###### string
The key to get from the response. Dot notation and array indexes are supported.

###### boolean
If `true`, the whole response is returned.

###### object
- `all: boolean`: If `true`, the whole response is returned. One of `all` or `key` is required.
- `key: string`: The key to get from the response. One of `all` or `key` is required.
- `default: any`: The value to return when the key is not in the response. The default is `null`.

#### Examples

###### Open the page of a record the tool just created:
The `ticket` page has `path: /tickets/{ticket_id}`. The `create-ticket` endpoint returns `{ ticket_id, status }`.
```yaml
mcp:
  endpoints:
    - id: create-ticket
      scope: mcp:write
      view:
        pageId: ticket
        pathParams:
          ticket_id:
            _response: ticket_id
```
A call that creates ticket `T-42` shows the page at `/tickets/T-42`.

###### Choose a tab from the result:
```yaml
view:
  pageId: ticket
  pathParams:
    ticket_id:
      _payload: ticket_id
  urlQuery:
    tab:
      _response:
        key: default_tab
        default: details
```
The path comes from the argument Claude passed, and the tab from what the routine returned, or `details` when it returned no `default_tab`.

###### Read a nested value:
```yaml
urlQuery:
  customer:
    _response: ticket.customer.id
```
