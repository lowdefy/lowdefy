<TITLE>
_url_query
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_url_query` operator retrieves values from the [`urlQuery`](/page-and-app-state) object, which represents the [query string](https://en.wikipedia.org/wiki/Query_string) parameters in the browser's URL.

**Key Characteristics:**

- **Visible in URL** - Query parameters appear in the browser address bar
- **Persists on reload** - Values remain when the page is refreshed
- **Shareable** - Users can share links containing query parameters
- **Bookmarkable** - Browser bookmarks preserve query parameters
- **JSON serialized** - Complex objects and arrays are supported through JSON encoding

Use `urlQuery` when you need data that:

- Should be shareable via URL
- Must persist through page reloads
- Represents user-modifiable filter or search state
- Needs to be bookmarkable

For hidden, session-only data, use `_input` instead.
</DESCRIPTION>

<SCHEMA>
```yaml
_url_query:
  type: string | boolean | object
  description: Access values from the URL query string.
  oneOf:
    - type: string
      description: The key to retrieve from urlQuery. Dot notation and block list indexes supported.
    - type: boolean
      description: If true, returns the entire urlQuery object.
    - type: object
      properties:
        key:
          type: string
          description: The key to retrieve. Dot notation and block list indexes supported.
        all:
          type: boolean
          description: If true, returns the entire urlQuery object.
        default:
          type: any
          description: Value to return if the key is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic record ID from URL

Fetch a record based on an ID in the URL query.

```yaml
# URL: /record-details?_id=REC-001

events:
  onMount:
    - id: fetch_record
      type: Request
      skip:
        _eq:
          - _url_query: _id
          - null
      params: get_record_by_id
    - id: redirect_if_no_id
      type: Link
      skip:
        _ne:
          - _url_query: _id
          - null
      params:
        pageId: records-list

requests:
  - id: get_record_by_id
    type: MongoDBFindOne
    connectionId: records
    properties:
      query:
        _id:
          _url_query: _id

blocks:
  - id: record_title
    type: Title
    properties:
      content:
        _string.concat:
          - 'Record: '
          - _url_query: _id
```

---

###### Example 2: Search and filter persistence

Maintain search state in the URL for shareability.

```yaml
# URL: /products?search=laptop&category=electronics&sort=price

events:
  onMount:
    - id: initialize_filters
      type: SetState
      params:
        filters:
          search:
            _url_query:
              key: search
              default: ''
          category:
            _url_query:
              key: category
              default: null
          sort_by:
            _url_query:
              key: sort
              default: 'name'

blocks:
  - id: search_input
    type: TextInput
    properties:
      title: Search Products
      value:
        _url_query: search
    events:
      onPressEnter:
        - id: update_search_url
          type: Link
          params:
            pageId: products
            urlQuery:
              search:
                _state: search_input
              category:
                _url_query: category
              sort:
                _url_query: sort

  - id: category_filter
    type: Selector
    properties:
      title: Category
      value:
        _url_query: category
      options:
        _global: enums.product_categories
    events:
      onChange:
        - id: update_category_url
          type: Link
          params:
            pageId: products
            urlQuery:
              search:
                _url_query: search
              category:
                _event: value
              sort:
                _url_query: sort
```

---

###### Example 3: Pagination with URL state

Preserve pagination state in shareable URLs.

```yaml
# URL: /records?page=3&pageSize=25

events:
  onMount:
    - id: set_pagination
      type: SetState
      params:
        pagination:
          current:
            _url_query:
              key: page
              default: 1
          pageSize:
            _url_query:
              key: pageSize
              default: 10
    - id: fetch_records
      type: Request
      params: get_paginated_records

requests:
  - id: get_paginated_records
    type: MongoDBAggregation
    connectionId: records
    properties:
      pipeline:
        - $facet:
            data:
              - $skip:
                  _product:
                    - _subtract:
                        - _url_query:
                            key: page
                            default: 1
                        - 1
                    - _url_query:
                        key: pageSize
                        default: 10
              - $limit:
                  _url_query:
                    key: pageSize
                    default: 10
            total:
              - $count: count

blocks:
  - id: records_table
    type: AgGridAlpine
    properties:
      rowData:
        _request: get_paginated_records.0.data

  - id: pagination_controls
    type: Pagination
    properties:
      current:
        _url_query:
          key: page
          default: 1
      pageSize:
        _url_query:
          key: pageSize
          default: 10
      total:
        _request: get_paginated_records.0.total.0.count
    events:
      onChange:
        - id: navigate_to_page
          type: Link
          params:
            pageId: records
            urlQuery:
              page:
                _event: current
              pageSize:
                _event: pageSize
```

---

###### Example 4: Tab and view state management

Preserve the active tab or view in the URL.

```yaml
# URL: /dashboard?tab=analytics&view=chart

blocks:
  - id: dashboard_tabs
    type: Tabs
    properties:
      activeKey:
        _url_query:
          key: tab
          default: overview
      items:
        - key: overview
          tab: Overview
        - key: analytics
          tab: Analytics
        - key: reports
          tab: Reports
    events:
      onChange:
        - id: update_tab_url
          type: Link
          params:
            pageId: dashboard
            urlQuery:
              tab:
                _event: key
              view:
                _url_query: view
    blocks:
      - id: analytics_content
        type: Box
        visible:
          _eq:
            - _url_query:
                key: tab
                default: overview
            - analytics
        blocks:
          - id: view_toggle
            type: ButtonSelector
            properties:
              value:
                _url_query:
                  key: view
                  default: chart
              options:
                - label: Chart
                  value: chart
                - label: Table
                  value: table
            events:
              onChange:
                - id: update_view_url
                  type: Link
                  params:
                    pageId: dashboard
                    urlQuery:
                      tab:
                        _url_query: tab
                      view:
                        _event: value

          - id: chart_view
            type: EChart
            visible:
              _eq:
                - _url_query:
                    key: view
                    default: chart
                - chart

          - id: table_view
            type: AgGridAlpine
            visible:
              _eq:
                - _url_query: view
                - table
```

---

###### Example 5: Complex filters with nested objects

Handle complex filter objects serialized in the URL.

```yaml
# URL: /search?filters={"status":"active","tags":["urgent","review"],"dateRange":{"start":"2024-01-01","end":"2024-12-31"}}

events:
  onMount:
    - id: parse_filters
      type: SetState
      params:
        active_filters:
          _if_none:
            - _url_query: filters
            - status: null
              tags: []
              dateRange:
                start: null
                end: null

blocks:
  - id: filter_panel
    type: Card
    properties:
      title: Filters
    blocks:
      - id: status_filter
        type: Selector
        properties:
          title: Status
          value:
            _url_query: filters.status
          options:
            - label: Active
              value: active
            - label: Inactive
              value: inactive
            - label: Pending
              value: pending

      - id: tags_filter
        type: MultipleSelector
        properties:
          title: Tags
          value:
            _url_query: filters.tags
          options:
            _global: enums.available_tags

      - id: date_range
        type: DateRangePicker
        properties:
          title: Date Range
          value:
            _if:
              test:
                _url_query: filters.dateRange.start
              then:
                - _url_query: filters.dateRange.start
                - _url_query: filters.dateRange.end
              else: null

      - id: apply_filters
        type: Button
        properties:
          title: Apply Filters
          type: primary
        events:
          onClick:
            - id: update_url_with_filters
              type: Link
              params:
                pageId: search
                urlQuery:
                  filters:
                    status:
                      _state: status_filter
                    tags:
                      _state: tags_filter
                    dateRange:
                      start:
                        _array.get:
                          on:
                            _state: date_range
                          index: 0
                      end:
                        _array.get:
                          on:
                            _state: date_range
                          index: 1

      - id: clear_filters
        type: Button
        properties:
          title: Clear All
        events:
          onClick:
            - id: clear_url_filters
              type: Link
              params:
                pageId: search
                urlQuery: {}

  - id: active_filters_display
    type: Paragraph
    visible:
      _ne:
        - _url_query:
            all: true
        - null
    properties:
      content:
        _string.concat:
          - 'Current filters: '
          - _json.stringify:
              _url_query: true
```

</EXAMPLES>
