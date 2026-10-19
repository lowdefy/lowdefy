# _request_details

```
(requestId: string): any
```

The `_request_details` operator returns detailed information of a request. If the request has not yet been called, the returned value is `null`.

The response includes the following fields:

- `blockId: string`: The id of the block from which the request was initiated.
- `loading: boolean`: When `true`, the request is awaiting a response.
- `payload: object`: The payload sent with the request.
- `requestId: string`: The id of the request.
- `response: object`: The response returned by the request. `null` while `loading` is true.
- `responseTime: number`: The time taken to get the response in milliseconds.

#### Arguments

###### string
The id of the request.

#### Examples

###### Using a request id:
```yaml
_request_details: my_request
```
Returns: The details of the specified request.

###### Whether the latest call is still loading:
```yaml
_request_details: my_request.0.loading
```
Returns: `true` while the latest call of the request awaits its response. The details are a list of the request's calls, latest first, so `0` is the latest call. Use it for a block's `loading`, for example a table's `loading` property.
