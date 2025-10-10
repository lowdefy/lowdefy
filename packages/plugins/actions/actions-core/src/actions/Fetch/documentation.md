<TITLE>
Fetch
<TITLE>

<DESCRIPTION>
The `Fetch` implements the [fetch web API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) and can be used to make HTTP requests directly from the web client.
<DESCRIPTION>

<USAGE>
```
(params: {
  url: string,
  options: object,
  responseFunction: string
}): string | object
```

### object
- `url: string`: __Required__ - The URL of the resource you want to fetch..
- `options: object`: The options object of the `fetch` global function. These include, but are not limited to:
  - `method: string`: The request method, e.g., `"GET"`, `"POST"`. The default is `"GET"`.
  - `headers: object`: An object with headers to add to the request.
  - `body: string`: The request body. Use the [`_json.stringify`](/_json) operator to create a JSON body.
- `responseFunction: enum`: If the `responseFunction` is specified, that function will be executed on the returned Response object. If specified this is equavalent to `await fetch(url, options).json()`. Should be one of of `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'formData'`.
</USAGE>

<EXAMPLES>
### Call a JSON API endpoint:
```yaml
- id: fetch
  type: Fetch
  params:
    url: https://example.com/api/products
    options:
      method: GET
    responseFunction: json
```

### Make a post request:
```yaml
- id: fetch
  type: Fetch
  params:
    url: https://example.com/api/products/abc
    options:
      method: POST
      headers:
        Content-Type: application/json
      body:
        _json.stringify:
          - _state: product
    responseFunction: json
```
</EXAMPLES>
