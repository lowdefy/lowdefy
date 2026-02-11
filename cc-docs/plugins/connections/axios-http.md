# @lowdefy/connection-axios-http

HTTP/REST API connection for Lowdefy using [Axios](https://axios-http.com/docs/intro).

## Connection Type

| Type | Purpose |
|------|---------|
| `AxiosHttp` | Connect to HTTP/REST APIs |

## Connection Configuration

```yaml
connections:
  - id: api
    type: AxiosHttp
    properties:
      baseUrl: https://api.example.com
      headers:
        Authorization:
          _string:
            - 'Bearer '
            - _secret: API_TOKEN
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `baseUrl` | string | Base URL for requests |
| `headers` | object | Default headers |
| `timeout` | number | Request timeout (ms) |
| `auth` | object | Basic auth credentials |

## Request Type

| Type | Purpose |
|------|---------|
| `AxiosHttp` | Make HTTP request |

## Request Configuration

```yaml
requests:
  - id: getUsers
    type: AxiosHttp
    connectionId: api
    properties:
      url: /users
      method: GET
      params:
        page:
          _state: page
        limit: 20
```

## Request Properties

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Request URL (appended to baseUrl) |
| `method` | string | HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `params` | object | URL query parameters |
| `data` | any | Request body |
| `headers` | object | Request-specific headers |
| `timeout` | number | Override connection timeout |
| `responseType` | string | Expected response type |

## Examples

### GET Request

```yaml
requests:
  - id: fetchData
    type: AxiosHttp
    connectionId: api
    properties:
      url: /items
      method: GET
      params:
        search:
          _state: searchQuery
```

### POST Request

```yaml
requests:
  - id: createItem
    type: AxiosHttp
    connectionId: api
    properties:
      url: /items
      method: POST
      data:
        name:
          _state: name
        description:
          _state: description
```

### PUT Request

```yaml
requests:
  - id: updateItem
    type: AxiosHttp
    connectionId: api
    properties:
      url:
        _string:
          - '/items/'
          - _state: itemId
      method: PUT
      data:
        _state: formData
```

### DELETE Request

```yaml
requests:
  - id: deleteItem
    type: AxiosHttp
    connectionId: api
    properties:
      url:
        _string:
          - '/items/'
          - _state: itemId
      method: DELETE
```

### File Upload

```yaml
requests:
  - id: uploadFile
    type: AxiosHttp
    connectionId: api
    properties:
      url: /upload
      method: POST
      headers:
        Content-Type: multipart/form-data
      data:
        file:
          _state: fileInput
```

### Custom Headers

```yaml
requests:
  - id: authenticatedRequest
    type: AxiosHttp
    connectionId: api
    properties:
      url: /protected
      method: GET
      headers:
        X-Custom-Header: value
        Authorization:
          _string:
            - 'Bearer '
            - _user: accessToken
```

## Response Handling

The response includes:
- `data` - Response body
- `status` - HTTP status code
- `headers` - Response headers

Access in state:
```yaml
_request: getUsers.data
```

## Error Handling

HTTP errors throw RequestError with:
- Status code
- Response data
- Original error message

Handle in actions:
```yaml
events:
  onClick:
    - id: fetch
      type: Request
      params:
        requestId: getUsers
      onError:
        - id: showError
          type: Message
          params:
            content: Request failed
            type: error
```
