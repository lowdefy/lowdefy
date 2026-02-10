# @lowdefy/blocks-google-maps

[Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) integration for Lowdefy.

## Block

| Block | Purpose |
|-------|---------|
| `GoogleMaps` | Google Maps display |

## Usage

```yaml
- id: map
  type: GoogleMaps
  properties:
    apiKey:
      _secret: GOOGLE_MAPS_API_KEY
    center:
      lat: 40.7128
      lng: -74.0060
    zoom: 12
    markers:
      - position:
          lat: 40.7128
          lng: -74.0060
        title: New York
```

## Properties

| Property | Purpose |
|----------|---------|
| `apiKey` | Google Maps API key |
| `center` | Map center coordinates |
| `zoom` | Zoom level (1-20) |
| `markers` | Array of marker objects |
| `mapTypeId` | roadmap, satellite, hybrid, terrain |
| `style` | Container style |

## Events

| Event | Payload |
|-------|---------|
| `onMarkerClick` | Clicked marker data |
| `onMapClick` | Click coordinates |
