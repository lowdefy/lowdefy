# PlacesAutocomplete

Address input with place suggestions from the Google Places Autocomplete Data API. Must be wrapped in a `GoogleMapsScript` block. The block value is an object: selecting a suggestion fetches the configured place fields, renames them through `resultMapping` and writes them to the value, while typing writes the free text to `labelField` so a form always holds a usable address. Typing, selecting or clearing first removes the keys the previous place wrote, so typed text never keeps another place's coordinates; sibling keys written by other blocks are preserved, and the value becomes null when none remain. `onPlaceChanged` receives the mapped place, `onChange` the new value, and `onError` fires when the Places API request fails.

> The PlacesAutocomplete block must be wrapped in a GoogleMapsScript block, with a valid Google Maps API key that has the Places API (New) enabled. Load the places library on the script, `libraries: [places]`, so it is ready on first render; when it is not listed the block imports it on demand through `google.maps.importLibrary`. Outside a GoogleMapsScript, or when the places library cannot be loaded, the block is a plain text input that still writes the label field. Suggestions are requested `debounce` milliseconds (default 250) after the last keystroke. The examples on this page require a configured API key to return suggestions.

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
          content:
            _string.concat:
              - "Selected: "
              - _event: place.formattedAddress
          duration: 2
    onError:
      - id: pa_error_message
        type: DisplayMessage
        params:
          status: error
          content:
            _event: message
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
| `allowClear` | boolean | `true` | Allow the user to clear the input. Clearing removes the place keys from the block value, and sets the value to null when no sibling keys remain. |
| `autoFocus` | boolean | `false` | Autofocus to the block on page load. |
| `backfill` | boolean | `false` | Backfill the highlighted suggestion into the input when using the keyboard. |
| `bordered` | boolean | `true` | Whether or not the input has a border style. Deprecated, use variant instead. |
| `debounce` | number | `250` | Milliseconds to wait after the last keystroke before requesting suggestions from the Places API. |
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
| `labelField` | string | `"formattedAddress"` | The key in the block value, after `resultMapping` is applied, that is displayed in the input and written when the user types free text. Typing removes the keys the previous place wrote (the mapped `input`, `id`, `formattedAddress` and `fetchFields` keys), so typed text never carries another place's fields. |
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
| `theme` | object | - | Antd design token overrides for this block. See [antd design tokens](https://ant.design/components/overview#design-token). See [Ant Design select tokens](https://ant.design/components/select#design-token). |
| `theme.borderRadius` | number | `6` | Border radius of the input. |
| `theme.borderRadiusLG` | number | `8` | Border radius for large size. |
| `theme.borderRadiusSM` | number | `4` | Border radius for small size. |
| `theme.controlHeight` | number | `32` | Height of the input. |
| `theme.controlHeightLG` | number | `40` | Height for large size. |
| `theme.controlHeightSM` | number | `24` | Height for small size. |
| `theme.fontSize` | number | `14` | Font size of the input text. |
| `theme.fontSizeLG` | number | `16` | Font size for large size. |
| `theme.fontSizeSM` | number | `14` | Font size for small size. |
| `theme.colorPrimary` | string | - | Primary color, used for focus border and active state. |
| `theme.colorPrimaryHover` | string | - | Primary hover color, used for hover border state. |
| `theme.colorBgContainer` | string | `"#ffffff"` | Background color of the selector. |
| `theme.colorBgElevated` | string | `"#ffffff"` | Background color of the dropdown. |
| `theme.colorText` | string | - | Text color of the input. |
| `theme.colorTextPlaceholder` | string | - | Placeholder text color. |
| `theme.colorTextDisabled` | string | - | Text color when disabled. |
| `theme.colorBorder` | string | - | Border color of the input. |
| `theme.hoverBorderColor` | string | - | Border color when hovered. |
| `theme.activeBorderColor` | string | - | Border color when focused/active. |
| `theme.activeOutlineColor` | string | - | Outline color when focused. |
| `theme.clearBg` | string | `"#ffffff"` | Background color of the clear button. |
| `theme.optionSelectedBg` | string | `"#e6f4ff"` | Background color of the selected option. |
| `theme.optionSelectedColor` | string | `"rgba(0, 0, 0, 0.88)"` | Text color of the selected option. |
| `theme.optionSelectedFontWeight` | number | `600` | Font weight of the selected option. |
| `theme.optionActiveBg` | string | `"rgba(0, 0, 0, 0.04)"` | Background color of the active (hovered) option. |
| `theme.optionFontSize` | number | `14` | Font size of dropdown option text. |
| `theme.optionHeight` | number | `32` | Height of each dropdown option. |
| `theme.optionLineHeight` | number | - | Line height of dropdown option text. |
| `theme.optionPadding` | string \| number | `"5px 12px"` | Padding of each dropdown option. |
| `theme.selectorBg` | string | `"#ffffff"` | Background color of the selector input. |
| `theme.zIndexPopup` | number | `1050` | Z-index of the dropdown popup. |
| `theme.showArrowPaddingInlineEnd` | number | `18` | Right padding when the arrow icon is shown. |
| `theme.lineWidth` | number | `1` | Border width of the input. |
| `theme.paddingInline` | number | `11` | Horizontal padding of the input. |
| `title` | string | - | Title to describe the input component, if no title is specified the block id is displayed - supports html. |
| `variant` | string | `"outlined"` | Input visual variant. When set, takes precedence over bordered. Enum: `outlined`, `filled`, `borderless`, `underlined`. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBlur` | \- | Trigger actions when the input loses focus. |
| `onChange` | `{ value }` | Trigger actions after the block value changes, by typing, by selecting a suggestion or by clearing the input. |
| `onClear` | \- | Trigger actions when the input is cleared. |
| `onError` | `{ message }` | Trigger actions when fetching suggestions or place fields fails, for example when the Places API is not enabled on the API key. When fetching place fields fails, the typed text stays in the block value and onPlaceChanged is not triggered. |
| `onFocus` | \- | Trigger actions when the input gains focus. |
| `onPlaceChanged` | `{ place, value }` | Trigger actions after a suggestion is selected and its place fields have been fetched and written to the block value. |
| `onSearch` | `{ value }` | Trigger actions when the search text changes. |
| `onTooltipClick` | \- | Trigger actions when the tooltip icon is clicked. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The PlacesAutocomplete input element. |
| `/selector` | The inner value container of the input (antd `content` semantic slot). |
| `/label` | The PlacesAutocomplete label. |
| `/extra` | The PlacesAutocomplete extra content. |
| `/feedback` | The PlacesAutocomplete validation feedback. |
| `/options` | Each suggestion in the dropdown. |
| `/popup` | The suggestions dropdown. |

No slots defined.
