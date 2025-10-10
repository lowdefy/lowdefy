<TITLE>
CallAPI
</TITLE>

<DESCRIPTION>
The `CallAPI` action invokes a server-side API endpoint defined in your Lowdefy application's configuration.
It sends an optional payload to the API and returns the response data, making it a way to execute server-side logic and orchestrate database operations from your Lowdefy pages.
</DESCRIPTION>

<USAGE>
```
(params: {
  endpointId: string,
  payload: object
}): void
```

### object
- `endpointId: string`: __Required__ - The id of the API endpoint to call.
- `payload: object`: Used to pass data such as state values from the app client to the endpoint as required.
</USAGE>

<EXAMPLES>
### Call an API endpoint:
```yaml
- id: call_my_api
  type: CallAPI
  params:
    endpointId: my_api_endpoint
```

### Call an API endpoint with a payload:
```yaml
- id: call_rating_api
  type: CallAPI
  params:
    endpointId: review_product
    payload:
      product_id:
        _url_query: product_id
      rating:
        _state: rating
      comment:
        _state: comment
```

### Call an API endpoint with client state as the payload:
```yaml
- id: call_my_api
  type: CallAPI
  params:
    endpointId: my_api_endpoint
    payload:
      _state: true
```
</EXAMPLES>
