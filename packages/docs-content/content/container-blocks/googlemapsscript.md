# GoogleMapsScript

Loads the Google Maps JavaScript API and wraps `GoogleMaps` and `GoogleMapsHeatmap` blocks as a parent container. Configure the API key, language, region, libraries, and API version.

> GoogleMapsScript loads the Google Maps JavaScript API. Only one GoogleMapsScript should be used per page. It must wrap GoogleMaps or GoogleMapsHeatmap blocks as a parent container. The examples below show configuration patterns — maps require a valid API key to render.

```yaml
- id: gms_full_config
  type: GoogleMapsScript
  properties:
    apiKey: null
    language: en
    region: US
    version: weekly
    libraries:
      - visualization
      - places
    channel: production
  blocks:
    - id: gms_full_config_map
      type: GoogleMaps
      properties:
        map:
          center:
            lat: 40.7128
            lng: -74.006
          zoom: 12
        markers:
          - position:
              lat: 40.7484
              lng: -73.9857
            label: A
            title: Empire State Building
          - position:
              lat: 40.6892
              lng: -74.0445
            label: B
            title: Statue of Liberty
          - position:
              lat: 40.7589
              lng: -73.9851
            label: C
            title: Times Square
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | string | - | Your Google Maps API key. |
| `libraries` | array | - | A list of Google libraries to load. See [Google Maps Libraries](https://developers.google.com/maps/documentation/javascript/libraries). |
| `language` | string | - | The language code for the Google Maps API (e.g. "en", "fr", "ja"). |
| `region` | string | - | The region code to bias geocoding results (e.g. "US", "GB"). See [localization](https://developers.google.com/maps/documentation/javascript/localization). |
| `version` | string | - | The version of the Google Maps JavaScript API to load (e.g. "weekly", "3.50"). |
| `channel` | string | - | A channel parameter for tracking API usage. |

No events defined.

No CSS keys defined.

| Slot | Description |
| --- | --- |
| `content` | Child blocks wrapped by the script provider. |
