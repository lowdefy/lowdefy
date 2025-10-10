<TITLE>
AxiosHttp
</TITLE>

<DESCRIPTION>

The `AxiosHttp` connection is used to connect to APIs and web servers using HTTP or HTTPS.

It uses the [axios](https://github.com/axios/axios) library.

The same properties can be set on both connections and requests. The properties will be merged, with the request properties overwriting connection properties. This allows properties like authentication headers and the baseURL to be set on the connection, with request specific properties like the request.

>Secrets like authentication headers and API keys should be stored using the [`_secret`](_secret) operator.

</DESCRIPTION>

<REQUESTS>

- AxiosHttp

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - AxiosHttp',
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'The server URL that will be used for the request.',
      errorMessage: {
        type: 'AxiosHttp property "url" should be a string.',
      },
    },
    method: {
      type: 'string',
      enum: ['get', 'delete', 'head', 'options', 'post', 'put', 'patch'],
      description: 'The request method to be used when making the request',
      errorMessage: {
        type: 'AxiosHttp property "method" should be a string.',
        enum: 'AxiosHttp property "method" is not a valid value.',
      },
    },
    baseURL: {
      type: 'string',
      description:
        'baseURL will be prepended to url unless url is absolute. It can be convenient to set baseURL for an axios connection so that requests can use relative urls.',
      errorMessage: {
        type: 'AxiosHttp property "baseURL" should be a string.',
      },
    },
    headers: {
      type: 'object',
      description:
        'An object with custom headers to be sent with the request. The object keys should be header names, and the values should be the string header values.',
      errorMessage: {
        type: 'AxiosHttp property "headers" should be an object.',
      },
    },
    params: {
      type: 'object',
      description: 'An object with URL parameters to be sent with the request.',
      errorMessage: {
        type: 'AxiosHttp property "params" should be an object.',
      },
    },
    data: {
      description:
        "The data to be sent as the request body. Only applicable for request methods 'put', 'post', and 'patch'. Can be an object, array or a string in the format 'Country=USA&City=New York'.",
    },
    timeout: {
      type: 'number',
      description:
        'The number of milliseconds before the request times out. If the request takes longer than timeout, the request will be aborted. Set to 0 for no timeout.',
      default: 0,
      errorMessage: {
        type: 'AxiosHttp property "timeout" should be a number.',
      },
    },
    auth: {
      type: 'object',
      description:
        'Indicates that HTTP Basic authorization should be used, and supplies credentials. This will set an Authorization header, overwriting any existing Authorization custom headers you have set using headers. Only HTTP Basic auth is configurable through this parameter, for Bearer tokens and such, use Authorization custom headers instead.',
      properties: {
        username: {
          type: 'string',
          description: 'HTTP Basic authorization username.',
          errorMessage: {
            type: 'AxiosHttp property "auth.username" should be a string.',
          },
        },
        password: {
          type: 'string',
          description: 'HTTP Basic authorization password.',
          errorMessage: {
            type: 'AxiosHttp property "auth.password" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'AxiosHttp property "auth" should be an object.',
      },
    },
    responseType: {
      type: 'string',
      enum: ['json', 'document', 'text'],
      description: 'The type of data that the server should respond with.',
      default: 'json',
      errorMessage: {
        type: 'AxiosHttp property "responseType" should be a string.',
        enum: 'AxiosHttp property "responseType" is not a valid value.',
      },
    },
    responseEncoding: {
      type: 'string',
      description: 'Indicates encoding to use for decoding responses.',
      default: 'utf8',
      errorMessage: {
        type: 'AxiosHttp property "responseEncoding" should be a string.',
      },
    },
    maxContentLength: {
      type: 'number',
      description: 'Defines the max size of the http response content allowed in bytes.',
      errorMessage: {
        type: 'AxiosHttp property "maxContentLength" should be a number.',
      },
    },
    maxRedirects: {
      type: 'number',
      description:
        'Defines the maximum number of redirects to follow. If set to 0, no redirects will be followed.',
      default: 5,
      errorMessage: {
        type: 'AxiosHttp property "maxRedirects" should be a number.',
      },
    },
    proxy: {
      type: 'object',
      description: 'Defines the hostname and port of the proxy server.',
      errorMessage: {
        type: 'AxiosHttp property "proxy" should be an object.',
      },
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

Properties for a AxiosHttp can be set on either the connection, the request, or both. However, both a connection and request need to be defined.

### A basic full example requesting data from https://jsonplaceholder.typicode.com

```yaml
lowdefy: {{ version }}
name: Lowdefy starter
connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com
pages:
  - id: welcome
    type: PageHeaderMenu
    requests:
      - id: get_posts
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /posts
    events:
      onInit:
        - id: fetch_get_posts
          type: Request
          params: get_posts
    blocks:
      - id: rest_data
        type: Markdown
        properties:
          content:
            _string.concat:
              - |
                ```yaml
              - _yaml.stringify:
                  - _request: get_posts
              - |
                ```
```

### Using the connection to set baseURL and authorization, and handle specific requests as requests

```yaml
connections:
  - id: app_api
    type: AxiosHttp
    properties:
      baseURL: app.com/api
      auth:
        username: api_user
        password:
          _secret: API_PASSWORD
# ...
requests:
  - id: get_orders
    type: AxiosHttp
    connectionId: app_api
    properties:
      url: /orders
  - id: update_order
    type: AxiosHttp
    connectionId: app_api
    payload:
      order_id:
        _state: order_id
      data:
        _state: true
    properties:
      url:
        _nunjucks:
          template: /orders/{{ order_id }}
          on:
            order_id:
              _payload: order_id
      method: post
      data:
        _payload: data
```

### Setting properties on only the connection

```yaml
connections:
  - id: get_count
    type: AxiosHttp
    properties:
      url: myapp.com/api/count
      headers:
        X-Api-Key:
          _secret: API_KEY
# ...
requests:
  - id: get_count
    type: AxiosHttp
    connectionId: get_count
```

### Setting properties on only the request, and using a generic connection

```yaml
connections:
  - id: axios
    type: AxiosHttp
# ...
requests:
  - id: get_api_1
    type: AxiosHttp
    connectionId: axios
    properties:
      url: app1.com/api/things
  - id: post_to_api_2
    type: AxiosHttp
    connectionId: axios
    payload:
      data:
        _state: true
    properties:
      url: api.otherapp.org/other/thing
      method: post
      data:
        _payload: data
```

</EXAMPLES>
