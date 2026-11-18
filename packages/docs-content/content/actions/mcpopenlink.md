# McpOpenLink

```
(params: {
  home?: boolean,
  pageId?: string,
  pathParams?: object,
  url?: string,
  urlQuery?: object
}): void
```

The `McpOpenLink` action asks the MCP host, such as Claude, that the page is shown in as the view of an MCP tool to open a link in the person's browser. A view cannot leave the host's frame itself, so this is how a page inside a host opens another site, or a page of the app at its own address.

Give one of `url`, `pageId` or `home`. A page of the app is opened at the app's own address, with its base path. Only `http` and `https` links are opened: a link with any other scheme, such as `mailto:` or `javascript:`, fails the action.

The action fails when the host refuses the link, so its `catch` actions run. It also fails when the page is not inside an MCP host: use the [`Link`](/Link) action there, and [`_mcp: embedded`](/_mcp) to choose between the two.

#### Parameters

###### object
  - `home: boolean`: Open the app's home page.
  - `pageId: string`: The pageId of a page in the app to open.
  - `pathParams: object`: Values for the placeholders in the [`path`](/page-paths) of the page named by `pageId`, by placeholder name.
  - `url: string`: The URL to open. A URL without a scheme is read as `https`, and a path starting with `/` is a path of the app.
  - `urlQuery: object`: URL query parameters to add to the link.

#### Examples

###### Open an external site in the browser:
```yaml
- id: open_docs
  type: McpOpenLink
  params:
    url: https://docs.lowdefy.com
```

###### Open a page of the app in the browser:
```yaml
- id: open_ticket
  type: McpOpenLink
  params:
    pageId: ticket
    pathParams:
      ticket_id:
        _state: ticket._id
    urlQuery:
      tab: notes
```
For an app at `https://app.example.com` and a page with `path: tickets/{ticket_id}`, this opens `https://app.example.com/tickets/1234?tab=notes`.

###### Use the host inside a view, and a new tab in the browser:
```yaml
events:
  onClick:
    - id: open_in_host
      type: McpOpenLink
      skip:
        _not:
          _mcp: embedded
      params:
        url: https://docs.lowdefy.com
    - id: open_in_browser
      type: Link
      skip:
        _eq:
          - _mcp: embedded
          - true
      params:
        url: https://docs.lowdefy.com
        newTab: true
```
