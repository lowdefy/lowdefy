<TITLE>
_input
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_input` operator retrieves values from the [`input`](/page-and-app-state) object. The `input` is a data object that can be set when navigating to a new page using the [`Link`](/link) action. Unlike `urlQuery`, the `input` data is:

- **Not visible in the URL** - Data is passed internally, keeping sensitive information hidden
- **Not persisted on page reload** - If the user refreshes the page, input data is lost
- **Not shareable** - Users cannot share links that include input data

Use `input` when you need to pass data between pages that:

- Should not be visible in the browser's address bar
- Contains sensitive or internal identifiers
- Is too large or complex for URL encoding
- Should not persist if the user refreshes

For data that needs to be persisted, shareable, or bookmarkable, use `urlQuery` instead.
</DESCRIPTION>

<SCHEMA>
```yaml
_input:
  type: string | boolean | object
  description: Access values from the page input object.
  oneOf:
    - type: string
      description: The key to retrieve from input. Dot notation and block list indexes supported.
    - type: boolean
      description: If true, returns the entire input object.
    - type: object
      properties:
        key:
          type: string
          description: The key to retrieve. Dot notation and block list indexes supported.
        all:
          type: boolean
          description: If true, returns the entire input object.
        default:
          type: any
          description: Value to return if the key is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic input value access

Navigate to a details page with an ID passed via input.

```yaml
# Source page - passing data via Link action:
id: view_details_button
type: Button
properties:
  title: View Details
events:
  onClick:
    - id: navigate_to_details
      type: Link
      params:
        pageId: record-details
        input:
          record_id:
            _state: selected_record._id
          record_type:
            _state: selected_record.type

# Destination page - accessing input values:
id: record-details
type: PageHeaderMenu
events:
  onMount:
    - id: fetch_record
      type: Request
      params:
        record_id:
          _input: record_id
        record_type:
          _input: record_type
```

---

###### Example 2: Using input with default values

Handle cases where input might not be provided.

```yaml
id: edit_page
type: PageHeaderMenu
properties:
  title:
    _if:
      test:
        _input: is_new
      then: Create New Record
      else: Edit Record
events:
  onMount:
    - id: set_form_mode
      type: SetState
      params:
        edit_mode:
          _input:
            key: is_new
            default: false
        record_id:
          _input:
            key: record_id
            default: null
    - id: fetch_existing
      type: Request
      skip:
        _or:
          - _input: is_new
          - _eq:
              - _input: record_id
              - null
      params: get_record_by_id
```

---

###### Example 3: Passing complex data between pages

Transfer structured data for a multi-step workflow.

```yaml
# Page 1 - Order summary, passing to confirmation:
id: confirm_order_button
type: Button
properties:
  title: Review Order
events:
  onClick:
    - id: go_to_confirmation
      type: Link
      params:
        pageId: order-confirmation
        input:
          order_items:
            _state: cart.items
          shipping_address:
            _state: checkout_form.shipping
          billing_address:
            _state: checkout_form.billing
          customer_notes:
            _state: checkout_form.notes
          total_amount:
            _state: order_total

# Page 2 - Order confirmation, using input data:
id: order-confirmation
type: PageHeaderMenu
blocks:
  - id: order_summary
    type: Card
    properties:
      title: Order Summary
    blocks:
      - id: items_list
        type: List
        properties:
          data:
            _input: order_items
        blocks:
          - id: item_row.$
            type: Descriptions
            properties:
              items:
                - label: Product
                  value:
                    _input: order_items.$.name
                - label: Quantity
                  value:
                    _input: order_items.$.quantity
                - label: Price
                  value:
                    _input: order_items.$.price

  - id: shipping_info
    type: Descriptions
    properties:
      title: Shipping Address
      items:
        - label: Street
          value:
            _input: shipping_address.street
        - label: City
          value:
            _input: shipping_address.city
        - label: Postal Code
          value:
            _input: shipping_address.postal_code

  - id: total_display
    type: Statistic
    properties:
      title: Order Total
      value:
        _input: total_amount
      prefix: '$'
```

---

###### Example 4: Conditional page behavior based on input

Adjust page content and actions based on navigation context.

```yaml
id: document-viewer
type: PageHeaderMenu
properties:
  title:
    _string.concat:
      - _if:
          test:
            _input: readonly
          then: 'View: '
          else: 'Edit: '
      - _input:
          key: document_name
          default: 'Document'
blocks:
  - id: edit_controls
    type: Box
    visible:
      _not:
        _input: readonly
    blocks:
      - id: save_button
        type: Button
        properties:
          title: Save Changes
          type: primary
        events:
          onClick:
            - id: save_document
              type: Request
              params:
                document_id:
                  _input: document_id
                content:
                  _state: document_content

  - id: readonly_notice
    type: Alert
    visible:
      _input: readonly
    properties:
      message: You are viewing this document in read-only mode
      type: info

  - id: back_button
    type: Button
    properties:
      title: Back
    events:
      onClick:
        - id: return_to_source
          type: Link
          params:
            pageId:
              _input:
                key: return_page
                default: documents-list
```

---

###### Example 5: Using the entire input object

Access all input data for logging or processing.

```yaml
id: process_page
type: PageHeaderMenu
events:
  onMount:
    - id: log_navigation
      type: Request
      params:
        all_input_data:
          _input: true # Gets entire input object
        timestamp:
          _date: now
    - id: validate_required_input
      type: SetState
      params:
        has_valid_input:
          _and:
            - _ne:
                - _input:
                    all: true
                - null
            - _ne:
                - _input: required_field
                - null
    - id: redirect_if_invalid
      type: Link
      skip:
        _state: has_valid_input
      messages:
        success: Missing required data, redirecting...
      params:
        pageId: home

blocks:
  - id: input_debug
    type: Json
    visible:
      _global: features.debug_mode
    properties:
      value:
        _input:
          all: true
```

</EXAMPLES>
