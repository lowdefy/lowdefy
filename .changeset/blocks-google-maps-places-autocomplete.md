---
'@lowdefy/blocks-google-maps': minor
---

feat(blocks-google-maps): add a `PlacesAutocomplete` input block. The block searches the Google Places Autocomplete Data API from inside a `GoogleMapsScript` that loads the places library, `libraries: [places]`. Its value is an object: selecting a suggestion fetches the place fields listed in `fetchFields`, renames them through `resultMapping` (dotted paths nest) and merges them into the existing value, while typing writes the free text to `labelField`, so a form still holds a usable address when no suggestion is picked. Suggestions can be restricted or biased through `requestOptions`, and the block emits `onPlaceChanged`, `onChange`, `onSearch`, `onClear`, `onBlur` and `onFocus`. Without the places library it degrades to a plain text input.
