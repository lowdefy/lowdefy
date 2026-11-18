# _mcp

```
(key: string): any
```

The `_mcp` operator tells a page whether it is shown inside an MCP host, such as Claude, as the view of an MCP tool, and how the host shows it. It can only be used on the web-client (Not in `requests` or `connections`).

The following keys are available.
- `embedded: boolean`: `true` when the page is shown inside an MCP host.
- `displayMode: string`: How the host shows the view. One of `inline`, `fullscreen` or `pip` (picture in picture). A block that reads it updates when the host changes the display mode.

Every key returns `null` when the page is not inside an MCP host: in a browser tab, in the development server and in a mobile app. Any other key is an error.

#### Arguments

###### string
The key to return, `embedded` or `displayMode`.

#### Examples

###### Hide the app's own menu when the page is shown inside a host:
```yaml
id: app_menu
type: Menu
visible:
  _not:
    _mcp: embedded
```
`_mcp: embedded` returns `true` inside a host and `null` in a browser tab, so the menu is shown in the browser.

###### Show a block only inside a host:
```yaml
id: ask_button
type: Button
visible:
  _eq:
    - _mcp: embedded
    - true
```

###### Show a block only while the view is fullscreen:
```yaml
id: details
type: Descriptions
visible:
  _eq:
    - _mcp: displayMode
    - fullscreen
```
`_mcp: displayMode` returns `inline`, `fullscreen` or `pip` inside a host and `null` outside one. The block appears and disappears as the host changes the display mode.
