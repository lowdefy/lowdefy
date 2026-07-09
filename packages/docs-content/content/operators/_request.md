# _request

```
(requestId: string): any
```

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

If the request was called via the [`Request`](/Request) action with `holdValue: true`, `_request` returns the previous response while the new request is loading instead of returning `null`. Use `_request_details: <id>.loading` to detect that a new call is still in-flight, and `_request_details: <id>.error` to detect a failure.

#### Arguments

###### string
The id of the request.

#### Examples

###### Using a request response:
```yaml
_request: my_request
```
Returns: The response returned by the request.

###### Using dot notation to get the data object from the response:
```yaml
_request: my_request.data
```
###### Using dot notation to get the first element of an array response:
```yaml
_request: array_request.0
```
###### Using dot notation and block list indexes to get the name field from the element corresponding to the block index of an array response:
```yaml
_request: array_request.$.name
```
