<TITLE>_request_details</TITLE>
<METADATA>env: Client</METADATA>
<DESCRIPTION>The `_request_details` operator returns detailed information of a request. If the request has not yet been called, the returned value is `null`.

The response includes the following fields:

- `blockId: string`: The id of the block from which the request was initiated.
- `loading: boolean`: When `true`, the request is awaiting a response.
- `payload: object`: The payload sent with the request.
- `requestId: string`: The id of the request.
- `response: object`: The response returned by the request. `null` while `loading` is true.
- `responseTime: number`: The time taken to get the response in milliseconds.</DESCRIPTION>
  <USAGE>(requestId: string): any ###### string The id of the request.</USAGE>
  <EXAMPLES>###### Using a request id:

```yaml
_request_details: my_request
```

Returns: The details of the specified request.</EXAMPLES>
