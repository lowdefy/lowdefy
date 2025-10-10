<TITLE>
GoogleMapsScript
</TITLE>

<DESCRIPTION>

This is a Lowdefy blocks wrapper for the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview). It is used to specify the api key and libraries to be used for the [`GoogleMaps`](./GoogleMaps) and [`GoogleMapsHeatmap`](./GoogleMapsHeatmap) blocks, and wraps these blocks as a parent container. Only one `GoogleMapsScript` blocks should be used on a page.v

### Properties

- `apiKey: string`: Your Google Maps API key.
- `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "Your Google Maps API key."
      },
      "libraries": {
        "type": "array",
        "description": "A list of Google libraries, see <a href='https://developers.google.com/maps/documentation/javascript/libraries'>more</a>.",
        "items": {
          "type": "string",
          "enum": [
            "drawing",
            "geometry",
            "journeySharing",
            "localContext",
            "places",
            "visualization"
          ]
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Simple Script

```yaml
id: google_maps_script
type: GoogleMapsScript
properties:
  apiKey:
    _build.env: GOOGLE_MAPS_API_KEY
blocks: []
```

### Script with libraries

```yaml
id: google_maps_script
type: GoogleMapsScript
properties:
  apiKey:
    _build.env: GOOGLE_MAPS_API_KEY
  libraries:
    - visualization
```

</EXAMPLES>
