# PlacesAutocomplete

Address input with place suggestions from the Google Places Autocomplete Data API. Must be wrapped in a `GoogleMapsScript` block loading the places library. The block value is an object: selecting a suggestion fetches the configured place fields, renames them through `resultMapping` and merges them into the value, while typing writes the free text to `labelField` so a form always holds a usable address.

> The PlacesAutocomplete block must be wrapped in a GoogleMapsScript block that loads the places library, `libraries: [places]`, with a valid Google Maps API key that has the Places API (New) enabled. Without the places library the block renders as a plain text input that still writes the label field. The examples on this page require a configured API key to return suggestions.

```yaml
- id: pa_default
  type: PlacesAutocomplete
```

```yaml
- id: pa_title
  type: PlacesAutocomplete
  properties:
    title: Delivery address
    placeholder: Search for an address
- id: pa_label_extra
  type: PlacesAutocomplete
  properties:
    title: Site address
    label:
      extra: Start typing, then pick a suggestion to capture the full address.
      tooltip: Addresses are verified against Google Places.
```

```yaml
- id: pa_fetch_fields
  type: PlacesAutocomplete
  properties:
    title: Address
    fetchFields:
      - addressComponents
      - location
      - id
      - displayName
```

```yaml
- id: pa_result_mapping
  type: PlacesAutocomplete
  properties:
    title: Address
    fetchFields:
      - location
      - addressComponents
    resultMapping:
      formattedAddress: address.line1
      location: address.coordinates
      addressComponents: address.components
    labelField: address.line1
```

```yaml
- id: pa_region_codes
  type: PlacesAutocomplete
  properties:
    title: Address in the United Kingdom
    requestOptions:
      includedRegionCodes:
        - gb
- id: pa_location_bias
  type: PlacesAutocomplete
  properties:
    title: Near central London
    requestOptions:
      includedPrimaryTypes:
        - street_address
      locationBias:
        center:
          lat: 51.5074
          lng: -0.1278
        radius: 20000
```

```yaml
- id: pa_size_small
  type: PlacesAutocomplete
  properties:
    title: Small
    size: small
- id: pa_size_middle
  type: PlacesAutocomplete
  properties:
    title: Middle
    size: middle
- id: pa_size_large
  type: PlacesAutocomplete
  properties:
    title: Large
    size: large
```

```yaml
- id: pa_variant_filled
  type: PlacesAutocomplete
  properties:
    title: Filled
    variant: filled
- id: pa_variant_borderless
  type: PlacesAutocomplete
  properties:
    title: Borderless
    variant: borderless
- id: pa_variant_underlined
  type: PlacesAutocomplete
  properties:
    title: Underlined
    variant: underlined
```

```yaml
- id: pa_disabled
  type: PlacesAutocomplete
  properties:
    title: Disabled
    disabled: true
- id: pa_no_clear
  type: PlacesAutocomplete
  properties:
    title: Clear button hidden
    allowClear: false
```

```yaml
- id: pa_custom_icon
  type: PlacesAutocomplete
  properties:
    title: Address
    optionsIcon:
      name: MdOutlineHome
      color: "#1890ff"
    loadingPlaceholder: Searching addresses...
    notFoundContent: No matching address
```

```yaml
- id: pa_required
  type: PlacesAutocomplete
  required: true
  properties:
    title: Address
  validate:
    - message: An address must be selected.
      status: error
      pass:
        _if_none:
          - _state: pa_required.formattedAddress
          - false
```

```yaml
- id: pa_events
  type: PlacesAutocomplete
  properties:
    title: Address
    fetchFields:
      - location
  events:
    onPlaceChanged:
      - id: pa_place_changed_message
        type: DisplayMessage
        params:
          content: Place selected.
          duration: 2
    onSearch:
      - id: pa_search_state
        type: SetState
        params:
          pa_last_search:
            _event: value
    onClear:
      - id: pa_clear_state
        type: SetState
        params:
          pa_last_search: null
```

Delivery details

```yaml
- id: pa_form_title
  type: Title
  properties:
    content: Delivery details
    level: 4
- id: pa_form_address
  type: PlacesAutocomplete
  properties:
    title: Street address
    placeholder: Search for a delivery address
    fetchFields:
      - addressComponents
      - location
    label:
      extra: Pick a suggestion to capture the coordinates for the driver.
- id: pa_form_instructions
  type: TextArea
  properties:
    title: Delivery instructions
    placeholder: Gate code, buzzer, where to leave the parcel
- id: pa_form_submit
  type: Button
  properties:
    title: Save address
    icon: AiOutlineSave
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowClear` | boolean | `true` | Allow the user to clear the selected place, sets the value to null. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `backfill` | boolean | `false` | Backfill the highlighted suggestion into the input when using the keyboard. |
| `defaultOpen` | boolean | `false` | Initial open state of the suggestions dropdown. |
| `disabled` | boolean | `false` | Disable the block if true. |
| `fetchFields` | array | - | Place fields to fetch when a suggestion is selected, in camelCase, for example `addressComponents`, `location` or `viewport`. `formattedAddress` is always fetched. See [Place fields](https://developers.google.com/maps/documentation/javascript/reference/place#Place). |
| `label` | object | - | Label properties. |
| `label.align` | string | `"left"` | Align label left or right when inline. Enum: `left`, `right`. |
| `label.colon` | boolean | `true` | Append label with colon. |
| `label.disabled` | boolean | `false` | Hide input label. |
| `label.extra` | string | - | Extra text to display beneath the content - supports html. |
| `label.hasFeedback` | boolean | `true` | Display feedback extra from validation, this does not disable validation. |
| `label.inline` | boolean | `false` | Render input and label inline. |
| `label.span` | number | - | Label inline span. |
| `label.title` | string | - | Label title - supports html. |
| `label.tooltip` | string \| object | - | Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon. |
| `label.tooltip.title` | string | - | Tooltip text shown on hover - supports html. |
| `label.tooltip.icon` | string | `"AiOutlineQuestionCircle"` | Name of the icon to show beside the label. |
| `label.tooltip.color` | string | - | Color of the tooltip icon. |
| `labelField` | string | `"formattedAddress"` | The key in the block value, after `resultMapping` is applied, that is displayed in the input and written when the user types free text. |
| `loadingPlaceholder` | string | `"Loading..."` | Text displayed in the dropdown while suggestions are being fetched. |
| `notFoundContent` | string | `"No results found"` | Text displayed in the dropdown when the search returns no suggestions. |
| `optionsIcon` | string \| object | `{"name":"MdLocationOn"}` | Icon displayed before each suggestion in the dropdown. |
| `placeholder` | string | `"Start typing to search"` | Placeholder text inside the block before the user types input. |
| `requestOptions` | object | - | Additional options passed to the autocomplete request. See [AutocompleteRequest](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest). |
| `requestOptions.includedPrimaryTypes` | array | - | Restrict suggestions to these place types, for example `street_address` or `locality`. |
| `requestOptions.includedRegionCodes` | array | - | Restrict suggestions to these regions, as up to 15 CLDR two character region codes, for example `["us", "gb"]`. |
| `requestOptions.language` | string | - | The language in which to return the suggestions. |
| `requestOptions.locationBias` | object | - | Bias suggestions towards an area, as a circle or a rectangle. Cannot be used with locationRestriction. |
| `requestOptions.locationRestriction` | object | - | Restrict suggestions to an area, as a circle or a rectangle. Cannot be used with locationBias. |
| `requestOptions.origin` | object | - | The origin from which the distance to a suggestion is calculated, as a lat and lng object. |
| `requestOptions.origin.lat` | number | - | Lateral coordinate. |
| `requestOptions.origin.lng` | number | - | Longitudinal coordinate. |
| `requestOptions.region` | string | - | The region code used to format the suggestions. |
| `resultMapping` | object | - | Rename the fetched place fields before they are written to the block value. Dotted target paths are nested, for example `{ formattedAddress: address.line1, location: geometry.location }`. |
| `size` | string | `"middle"` | Size of the block. Enum: `small`, `middle`, `large`. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | `"outlined"` | Input visual variant. Enum: `outlined`, `filled`, `borderless`, `underlined`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger actions when the input loses focus. |
| `onChange` | \- | Trigger actions when the input value changes, by typing or by selection. |
| `onClear` | \- | Trigger actions when the input is cleared. |
| `onFocus` | \- | Trigger actions when the input gains focus. |
| `onPlaceChanged` | \- | Trigger actions after a suggestion is selected and its place fields have been fetched. |
| `onSearch` | `{ value }` | Trigger actions when the search text changes. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PlacesAutocomplete input element. |
| `/label` | The PlacesAutocomplete label. |
| `/extra` | The PlacesAutocomplete extra content. |
| `/feedback` | The PlacesAutocomplete validation feedback. |

No slots defined.
