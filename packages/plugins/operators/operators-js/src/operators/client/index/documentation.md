<TITLE>
_index
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_index` operator returns the current array index when used within a [list block](/lists). Lists in Lowdefy allow you to render an array of blocks dynamically based on data. When inside a list context, `_index` provides access to the current iteration index (0-based).

This operator is particularly useful for:

- Accessing the correct element in parallel arrays
- Creating numbered displays
- Applying alternating styles based on position
- Building unique identifiers for list items

The operator returns the index as a number, starting from 0 for the first item.
</DESCRIPTION>

<SCHEMA>
```yaml
_index:
  type: number | string | object
  description: Access the current list index or specific index values.
  oneOf:
    - type: number
      description: Returns the index at a specific depth (0 for innermost, 1 for parent, etc.)
    - type: string
      description: Named index reference using dot notation.
    - type: object
      properties:
        key:
          type: string | number
          description: The index depth or named reference.
        all:
          type: boolean
          description: If true, returns all index values as an array.
        default:
          type: any
          description: Value to return if the index is not available.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic index display

Show item numbers in a list.

```yaml
id: items_list
type: List
properties:
  data:
    _request: get_items
blocks:
  - id: item_row.$
    type: Box
    layout:
      direction: row
    blocks:
      - id: item_number.$
        type: Paragraph
        style:
          fontWeight: bold
          marginRight: 8px
        properties:
          content:
            _string.concat:
              - _sum:
                  - _index: 0
                  - 1
              - '.'
      - id: item_name.$
        type: Paragraph
        properties:
          content:
            _state: items.$.name
```

---

###### Example 2: Alternating row styles

Apply different styles based on even/odd index.

```yaml
id: records_list
type: List
properties:
  data:
    _request: get_records
blocks:
  - id: record_card.$
    type: Card
    style:
      backgroundColor:
        _if:
          test:
            _eq:
              - _math.mod:
                  - _index: 0
                  - 2
              - 0
          then: '#f5f5f5'
          else: '#ffffff'
    properties:
      title:
        _state: records.$.title
    blocks:
      - id: record_content.$
        type: Paragraph
        properties:
          content:
            _state: records.$.description
```

---

###### Example 3: Accessing parallel array data

Use index to correlate data from multiple arrays.

```yaml
id: comparison_list
type: List
properties:
  data:
    _state: products
blocks:
  - id: product_row.$
    type: Descriptions
    properties:
      items:
        - label: Product Name
          value:
            _state: products.$.name
        - label: Current Price
          value:
            _state: products.$.price
        - label: Previous Price
          value:
            _array.get:
              on:
                _state: historical_prices
              index:
                _index: 0
```

---

###### Example 4: Building unique element IDs

Create unique identifiers for form elements in a list.

```yaml
id: form_fields_list
type: List
properties:
  data:
    _state: form_field_configs
blocks:
  - id: field_container.$
    type: Box
    blocks:
      - id: field_input.$
        type: TextInput
        properties:
          title:
            _state: form_field_configs.$.label
          name:
            _string.concat:
              - 'field_'
              - _index: 0
          placeholder:
            _state: form_field_configs.$.placeholder
      - id: field_position.$
        type: Paragraph
        style:
          fontSize: 10
          color: '#888'
        properties:
          content:
            _string.concat:
              - 'Field '
              - _sum:
                  - _index: 0
                  - 1
              - ' of '
              - _array.length:
                  _state: form_field_configs
```

---

###### Example 5: Nested lists with multiple indices

Access parent and child indices in nested list structures.

```yaml
id: categories_list
type: List
properties:
  data:
    _state: categories
blocks:
  - id: category_section.$
    type: Card
    properties:
      title:
        _string.concat:
          - 'Category '
          - _sum:
              - _index: 0 # Outer list index
              - 1
          - ': '
          - _state: categories.$.name
    blocks:
      - id: products_list.$
        type: List
        properties:
          data:
            _state: categories.$.products
        blocks:
          - id: product_item.$.$
            type: Box
            layout:
              direction: row
            style:
              padding: 8px
              backgroundColor:
                _if:
                  test:
                    _eq:
                      - _math.mod:
                          - _index: 0 # Inner list index
                          - 2
                      - 0
                  then: '#fafafa'
                  else: '#ffffff'
            blocks:
              - id: product_number.$.$
                type: Paragraph
                style:
                  fontWeight: bold
                  marginRight: 16px
                properties:
                  content:
                    _string.concat:
                      - _sum:
                          - _index: 1 # Outer list index (parent)
                          - 1
                      - '.'
                      - _sum:
                          - _index: 0 # Inner list index
                          - 1
              - id: product_name.$.$
                type: Paragraph
                properties:
                  content:
                    _state: categories.$.products.$.name
```

</EXAMPLES>
