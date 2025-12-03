<TITLE>
_base64
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_base64` operator converts strings to and from [Base64](https://en.wikipedia.org/wiki/Base64) encoding format. Base64 is commonly used to encode binary data as ASCII text, making it safe for transmission in URLs, JSON, and other text-based formats.

This operator provides two methods:

- `encode`: Converts a UTF-8 string to Base64 format
- `decode`: Converts a Base64 string back to UTF-8 format

> **Note**: This operator uses the browser's built-in `btoa()` and `atob()` functions. For server-side Base64 operations, use the server-side `_base64` operator which uses Node.js Buffer.
> </DESCRIPTION>

<SCHEMA>
```yaml
_base64.encode:
  type: string
  description: The UTF-8 string to encode to Base64.
  returns: string

\_base64.decode:
type: string
description: The Base64 string to decode to UTF-8.
returns: string

````
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic string encoding
Encode a simple string to Base64 format.

```yaml
id: encoded_value
type: Paragraph
properties:
  content:
    _base64.encode: Hello, World!
````

Returns: `"SGVsbG8sIFdvcmxkIQ=="`

---

###### Example 2: Basic string decoding

Decode a Base64 string back to its original form.

```yaml
id: decoded_message
type: Paragraph
properties:
  content:
    _base64.decode: SGVsbG8sIFdvcmxkIQ==
```

Returns: `"Hello, World!"`

---

###### Example 3: Encoding form data for URL transmission

Encode user input for safe inclusion in URLs or API requests.

```yaml
id: generate_link_button
type: Button
properties:
  title: Generate Shareable Link
events:
  onClick:
    - id: create_share_link
      type: SetState
      params:
        shareable_link:
          _string.concat:
            - 'https://app.example.com/share?data='
            - _base64.encode:
                _json.stringify:
                  name:
                    _state: form.name
                  settings:
                    _state: form.settings
    - id: copy_to_clipboard
      type: CopyToClipboard
      params:
        _state: shareable_link
```

---

###### Example 4: Decoding shared configuration data

Decode configuration data received via URL query parameters.

```yaml
id: config_page
type: PageHeaderMenu
properties:
  title: Shared Configuration
events:
  onMount:
    - id: decode_config
      type: SetState
      skip:
        _eq:
          - _url_query: config
          - null
      params:
        imported_config:
          _json.parse:
            _base64.decode:
              _url_query: config
blocks:
  - id: config_display
    type: Descriptions
    visible:
      _ne:
        - _state: imported_config
        - null
    properties:
      items:
        - label: Imported Name
          value:
            _state: imported_config.name
        - label: Settings Count
          value:
            _array.length:
              _if_none:
                - _state: imported_config.settings
                - []
```

---

###### Example 5: Creating encoded data URIs for downloads

Generate encoded content for downloadable files.

```yaml
blocks:
  - id: export_section
    type: Card
    properties:
      title: Export Data
    blocks:
      - id: export_format
        type: ButtonSelector
        properties:
          title: Export Format
          options:
            - label: JSON
              value: json
            - label: CSV
              value: csv
      - id: export_button
        type: Button
        properties:
          title: Download Export
          icon: AiOutlineDownload
        events:
          onClick:
            - id: prepare_export
              type: SetState
              params:
                export_content:
                  _if:
                    test:
                      _eq:
                        - _state: export_format
                        - json
                    then:
                      _json.stringify:
                        _state: data_records
                    else:
                      _state: csv_formatted_data
            - id: create_download
              type: SetState
              params:
                download_uri:
                  _string.concat:
                    - 'data:text/'
                    - _state: export_format
                    - ';base64,'
                    - _base64.encode:
                        _state: export_content
            - id: trigger_download
              type: Link
              params:
                url:
                  _state: download_uri
                newTab: true
```

</EXAMPLES>
