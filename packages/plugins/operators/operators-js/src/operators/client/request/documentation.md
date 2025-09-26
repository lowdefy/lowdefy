<TITLE>_request</TITLE>
<METADATA>env: Client</METADATA>
<DESCRIPTION>The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.</DESCRIPTION>
<USAGE>(requestId: string): any ###### string The id of the request.</USAGE>
<EXAMPLES>###### Using a request response:
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

````yaml
_request: array_request.$.name
```</EXAMPLES>
````
