<TITLE>
_event
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_event` operator retrieves values from the `event` object. The `event` object is a data object provided to an [action](/events-and-actions) by an [event](/events-and-actions) trigger. This object contains contextual information about what triggered the event, such as click coordinates, form field values, or custom data passed by the triggering component.

The `event` object is also available to [requests and connections](/connections-and-requests) called by the [`Request`](/Request) action, allowing you to pass event data to server-side operations.

Common event properties include:

- Block events (onClick, onChange, etc.) may include block-specific data
- Form field changes include the new value
- Custom events can include any data passed by the component
  </DESCRIPTION>

<SCHEMA>
```yaml
_event:
  type: string | boolean | object
  description: Access values from the event object.
  oneOf:
    - type: string
      description: The key to retrieve from the event object. Dot notation and block list indexes supported.
    - type: boolean
      description: If true, returns the entire event object.
    - type: object
      properties:
        key:
          type: string
          description: The key to retrieve. Dot notation and block list indexes supported.
        all:
          type: boolean
          description: If true, returns the entire event object.
        default:
          type: any
          description: Value to return if the key is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic event value access

Access a value from an event triggered by a button click.

```yaml
id: action_button
type: Button
properties:
  title: Perform Action
events:
  onClick:
    - id: log_event
      type: SetState
      params:
        last_click_timestamp:
          _event: timestamp
        click_target:
          _event: blockId
```

---

###### Example 2: Handling form field changes

Respond to input changes with event data.

```yaml
id: search_input
type: TextInput
properties:
  title: Search
  placeholder: Type to search...
events:
  onChange:
    - id: update_search
      type: SetState
      params:
        search_query:
          _event: value
    - id: trigger_search
      type: Request
      skip:
        _lt:
          - _string.length:
              _event: value
          - 3
      params:
        query:
          _event: value
```

---

###### Example 3: Processing table row selection events

Handle complex event data from a data table.

```yaml
id: records_table
type: AgGridAlpine
properties:
  rowData:
    _request: get_all_records
  columnDefs:
    - field: name
      headerName: Name
    - field: status
      headerName: Status
    - field: created_date
      headerName: Created
events:
  onRowClick:
    - id: set_selected_record
      type: SetState
      params:
        selected_record:
          _event: row
        selected_record_id:
          _event: row._id
    - id: open_details_modal
      type: SetState
      params:
        show_details_modal: true
        modal_data:
          record_name:
            _event: row.name
          record_status:
            _event: row.status
          row_index:
            _event: rowIndex
```

---

###### Example 4: Using event data in API requests

Pass event data to server-side requests for processing.

```yaml
id: file_upload
type: S3UploadButton
properties:
  title: Upload Document
  accept: '.pdf,.doc,.docx'
events:
  onSuccess:
    - id: save_file_record
      type: Request
      params: create_file_record
    - id: notify_success
      type: Message
      params:
        content:
          _string.concat:
            - 'Successfully uploaded: '
            - _event: file.name
        type: success

# In requests:
requests:
  - id: create_file_record
    type: MongoDBInsertOne
    connectionId: files
    properties:
      doc:
        filename:
          _event: file.name
        file_key:
          _event: s3.key
        file_size:
          _event: file.size
        content_type:
          _event: file.type
        uploaded_by:
          _user: id
        uploaded_at:
          _date: now
```

---

###### Example 5: Complex event handling with default values and nested data

Handle events with optional data and nested structures.

```yaml
id: interactive_map
type: MapComponent
properties:
  markers:
    _request: get_location_markers
events:
  onMarkerClick:
    - id: show_location_info
      type: SetState
      params:
        selected_location:
          id:
            _event: marker.id
          name:
            _event: marker.name
          coordinates:
            lat:
              _event: marker.position.lat
            lng:
              _event: marker.position.lng
          category:
            _event:
              key: marker.category
              default: 'Uncategorized'
          rating:
            _event:
              key: marker.metadata.rating
              default: 'Not rated'
    - id: fetch_location_details
      type: Request
      params:
        location_id:
          _event: marker.id
        include_reviews:
          _event:
            key: marker.metadata.has_reviews
            default: false
  onMapClick:
    - id: deselect_location
      type: SetState
      params:
        selected_location: null
        click_coordinates:
          _event: true # Get entire event object
```

</EXAMPLES>
