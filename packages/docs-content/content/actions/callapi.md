# CallAPI

```
(params: {
  endpointId: string,
  payload?: object,
  holdValue?: boolean
}): void
```

The `CallAPI` action invokes a server-side API endpoint defined in your Lowdefy application's configuration.
It sends an optional payload to the API and returns the response data, making it a way to execute server-side logic and orchestrate database operations from your Lowdefy pages.

> **Note:** `CallAPI` can only target endpoints with `type: Api`. Endpoints with `type: InternalApi` are server-only and cannot be called from client pages. See [Lowdefy APIs](/lowdefy-api) for details.

#### Parameters

###### object
  - `endpointId: string`: __Required__ - The id of the API endpoint to call.
  - `payload: object`: Used to pass data such as state values from the app client to the endpoint as required.
  - `holdValue: boolean`: Optional. When `true`, the previous response is retained on `apiResponses[endpointId][0].response` while the new call is loading. UI bound to `_api: <endpointId>.response` continues to display the previous response instead of going to `null`. The previous response is also retained if the new call errors out — inspect `_api: <endpointId>.error` to detect failures. Defaults to `false`. `holdValue` is currently only settable on the action call.

#### Examples

###### Call an API endpoint:
```yaml
- id: call_my_api
  type: CallAPI
  params:
    endpointId: my_api_endpoint
```

###### Call an API endpoint with a payload:
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

###### Call an API endpoint with client state as the payload:
```yaml
- id: call_my_api
  type: CallAPI
  params:
    endpointId: my_api_endpoint
    payload:
      _state: true
```

###### Refresh API data without flashing the previous response:
```yaml
- id: refresh_dashboard
  type: CallAPI
  params:
    endpointId: dashboard_data
    holdValue: true
```
