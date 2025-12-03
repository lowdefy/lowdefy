<TITLE>
_location
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_location` operator retrieves values from the browser's [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) interface. The Location interface represents the URL of the current window, allowing you to access URL components and application-specific identifiers.

**Available Properties:**

- `basePath: string` - The application base path setting
- `hash: string` - The fragment identifier (after `#`) in the URL
- `homePageId: string` - The configured home page ID for the application
- `host: string` - The hostname and port (e.g., `example.com:3000`)
- `hostname: string` - The domain name (e.g., `example.com`)
- `href: string` - The complete URL string
- `origin: string` - The protocol, hostname, and port (e.g., `https://example.com`)
- `pageId: string` - The current Lowdefy page ID
- `pathname: string` - The path portion of the URL (e.g., `/products/details`)
- `port: string` - The port number
- `protocol: string` - The protocol scheme (`http:` or `https:`)
- `search: string` - The query string including `?` (e.g., `?id=123&sort=name`)

> **Note**: This operator can only be used on the web client, not in requests or connections.
> </DESCRIPTION>

<SCHEMA>
```yaml
_location:
  type: string
  description: The location property to retrieve.
  enum:
    - basePath
    - hash
    - homePageId
    - host
    - hostname
    - href
    - origin
    - pageId
    - pathname
    - port
    - protocol
    - search
  returns: string
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Display current page information

Show the current page location details.

```yaml
id: page_info
type: Descriptions
properties:
  title: Current Location
  items:
    - label: Page ID
      value:
        _location: pageId
    - label: Full URL
      value:
        _location: href
    - label: Domain
      value:
        _location: hostname
```

---

###### Example 2: Build shareable links

Create links that include the current page context.

```yaml
id: share_button
type: Button
properties:
  title: Copy Share Link
  icon: AiOutlineShareAlt
events:
  onClick:
    - id: create_share_link
      type: SetState
      params:
        share_link:
          _string.concat:
            - _location: origin
            - '/shared/'
            - _state: document.share_id
    - id: copy_link
      type: CopyToClipboard
      params:
        _state: share_link
    - id: notify
      type: Message
      params:
        content: Link copied to clipboard!
        type: success
```

---

###### Example 3: Conditional content based on environment

Show different content based on the deployment environment.

```yaml
id: environment_banner
type: Alert
visible:
  _or:
    - _string.includes:
        on:
          _location: hostname
        value: localhost
    - _string.includes:
        on:
          _location: hostname
        value: staging
properties:
  type:
    _if:
      test:
        _string.includes:
          on:
            _location: hostname
          value: localhost
      then: info
      else: warning
  message:
    _if:
      test:
        _string.includes:
          on:
            _location: hostname
          value: localhost
      then: Development Environment
      else: Staging Environment - Not Production Data
```

---

###### Example 4: Navigation breadcrumbs and context

Build navigation context using location information.

```yaml
id: page_header
type: PageHeader
properties:
  title:
    _string.concat:
      - _state: record.name
      - ' - Details'
  breadcrumb:
    list:
      - pageId:
          _location: homePageId
        label: Home
        icon: AiOutlineHome
      - pageId: records-list
        label: Records
      - label:
          _state: record.name

id: back_button
type: Button
properties:
  title: Back to List
  icon: AiOutlineArrowLeft
events:
  onClick:
    - id: navigate_back
      type: Link
      params:
        pageId: records-list
        urlQuery:
          # Preserve any filters from the URL
          filter:
            _if:
              test:
                _string.includes:
                  on:
                    _location: search
                  value: filter
              then:
                _url_query: filter
              else: null
```

---

###### Example 5: API endpoint configuration and logging

Use location data for API calls and analytics.

```yaml
events:
  onMount:
    - id: log_page_view
      type: Request
      params:
        page_id:
          _location: pageId
        full_url:
          _location: href
        referrer:
          _location: pathname
        query_string:
          _location: search

blocks:
  - id: api_status
    type: Card
    properties:
      title: API Configuration
    blocks:
      - id: api_details
        type: Descriptions
        properties:
          items:
            - label: API Base URL
              value:
                _string.concat:
                  - _location: origin
                  - '/api/v1'
            - label: WebSocket URL
              value:
                _string.concat:
                  - _if:
                      test:
                        _eq:
                          - _location: protocol
                          - 'https:'
                      then: 'wss://'
                      else: 'ws://'
                  - _location: host
                  - '/ws'
            - label: Current Environment
              value:
                _switch:
                  branches:
                    - if:
                        _string.includes:
                          on:
                            _location: hostname
                          value: localhost
                      then: Development
                    - if:
                        _string.includes:
                          on:
                            _location: hostname
                          value: staging
                      then: Staging
                  default: Production

  - id: deep_link_generator
    type: Box
    blocks:
      - id: link_preview
        type: Paragraph
        properties:
          content:
            _string.concat:
              - _location: origin
              - _location: basePath
              - '/record-details?_id='
              - _state: selected_record._id
              - _if:
                  test:
                    _location: hash
                  then:
                    _location: hash
                  else: ''
```

</EXAMPLES>
