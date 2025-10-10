<TITLE>
Request
<TITLE>

<DESCRIPTION>
The `Request` action calls a request, or if used during an `onInit` event, calls those requests while a page loads.
`Request` can be used to call all requests on a page, a list of requests, or a single request. The `Request` action is synchronous, actions defined after
it will only run once all the called requests have returned.

To call requests that load data, the `onInitAsync`, `onMount` and `onMountAsync` events can be used. These will execute the actions while the page begins to render. If the `onInit` event is used, the page will only start rendering after the actions have completed.

`Request` can be called without any parameters to call all requests in the page. It can also be called with a list of requestIds or a single requestId to call.
<DESCRIPTION>

<USAGE>
```
(options: {all: boolean}): void
(requestId: string): void
(requestIds: string[]): void
```

###### object
- `all: boolean`: All requests in the page are called if `all` is set to true.

###### string
A requestId of the request to call.

###### string[]
An array of requestIds of the requests to call.
</USAGE>

<EXAMPLES>
### Call a single request:
```yaml
- id: call_one_request
  type: Request
  params: my_request_id
```

### Call a list of requests:
```yaml
- id: call_many_requests
  type: Request
  params:
    - my_request_id_1
    - my_request_id_2
    - my_request_id_3
```

### Call all requests:
```yaml
- id: call_all
  type: Request
  params:
    all: true
```
</EXAMPLES>
