<TITLE>
_location
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_location` operator gets a value from the browser [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) interface. The Location interface represents the location (URL) of the window object it is linked to, thus can return the URL elements of the current window. It can only be used on the web-client (Not in `requests` or `connections`).

The following location properties are available.

- `basePath: string`: The application base path setting.
- `hash: string`: A string containing a '#' followed by the fragment identifier of the URL.
- `host: string`: A string containing the host, that is the hostname, a `:`, and the port of the URL.
- `hostname: string`: The domain of the URL.
- `homePageId: string`: The home page id.
- `href: string`: The entire URL string.
- `origin: string`: The canonical form of the origin of the specific location.
- `pageId: string`: The current page id.
- `pathname: string`: A string containing an initial `/`` followed by the path of the URL, not including the query string or fragment.
- `port: string`: The port number of the URL
- `protocol: string`: The protocol scheme of the URL, mostly `http:` or `https:`.
- `search: string`: A string containing a '?' followed by the parameters or "querystring" of the URL.
  </DESCRIPTION>

<USAGE>
```
(key: string): any
```

###### string

If called with a string argument, the value of the key in the `location` object is returned. If the value is defined, `null` is returned.
</USAGE>

<EXAMPLES>
###### Get the `origin` from `location`:
```yaml
_location: origin
```
Returns: The current `window.location.origin`, in this case 'https://docs.lowdefy.com'.

###### Get the `pathname` from `location`:

```yaml
_location: pathname
```

Returns: The current `window.location.pathname`, in this case '/\_location'.
</EXAMPLES>
