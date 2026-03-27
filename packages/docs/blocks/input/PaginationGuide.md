## Example: Server-side pagination with MongoDB

Pass `skip` and `pageSize` via the request `_payload`, then re-fetch on page change:

```yaml
requests:
  - id: get_items
    type: MongoDBAggregation
    connectionId: mongodb
    payload:
      pagination:
        _state: pagination
    properties:
      pipeline:
        - $facet:
            rows:
              - $skip:
                  _payload: pagination.skip
              - $limit:
                  _payload: pagination.pageSize
            count:
              - $count: total

blocks:
  - id: pagination
    type: Pagination
    properties:
      total:
        _request: get_items.count.0.total
      showSizeChanger: true
      showTotal: true
    events:
      onChange:
        - id: refetch
          type: Request
          params: get_items
      onSizeChange:
        - id: refetch
          type: Request
          params: get_items

  - id: table
    type: AgGridAlpine
    properties:
      rowData:
        _request: get_items.rows
      columnDefs:
        - field: name
        - field: status
        - field: createdAt
```

`$facet` returns both paginated rows and the total count in one query. The Pagination block maintains `skip` and `pageSize` in state automatically. State values are passed to the request via `payload` / `_payload` so they are evaluated server-side.
