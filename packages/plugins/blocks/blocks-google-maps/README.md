# Lowdefy Google Maps Blocks

This is a Lowdefy blocks wrapper for this the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).

To use this block, define a [@googlemaps/react-wrapper](https://www.npmjs.com/package/@googlemaps/react-wrapper). It currently implements:
- [Map](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)
- [Heatmap](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions)
- [Markers](https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions)

### Properties

- `apiKey: string`: Your Goolge Maps API key.
- `map: mapOptions`: All [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
  - `center: { lat: number, lng: number }`: A coordinate position object by which to center the map.
  - `zoom: number`: Map zoom level.
- `heatmap: heatmapOptions`: Add a heatmap layer, see more [heatmap options](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions). This will automatically load the `visualization` library.
  - `data: { lat: number, lng: number } | { location: { lat: number, lng: number }, weight: number }[]`: A list of heatmap data points.
- `style: cssObject`: A style object applied to the map element.
- `markers: markerOptions[]`: A list of Markers with properties, `map` is provided by the default by the block, see [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers) for configuration details.
- `resetBoundsOnResize`: Default: false, When true this will reset the map bounds if the parent resizes.

### Events

- `onClick`: Trigger onClick actions when the map is clicked, returns `_event` object:
  - `event`: event object
  - `lat`: latitudinal coordinate
  - `lng`: longitudinal coordinate
  - `maps`: has functions removed
  - `x`: position on map block
  - `y`: position on map block

<!-- TODO:

- `onClickMarker`: Trigger onClick actions when a marker is clicked, returns `_event` object:
  - `domEvent`: event object
  - `latLng`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `maps`: has functions removed
  - `pixel`:
    - `x`
    - `y`

### Methods

- `addMarker`: Accepts a single parameter object `marker` with marker properties.
- `removeMarker`: Accepts a single parameter object `marker` with position property.

-->

## Examples

1. Add a list of markers, one with a tooltip:

  ```yaml
  - id: google_maps
    type: GoogleMaps
    properties:
      apiKey: 'YOUR_API_KEY'
      map:
        panControl: true
        zoomControl: true
        fullscreenControl: true
        zoom: 14
        center:
          lat: -25.344
          lng: 131.036
      markers:
        - position:
            lat: -25.344
            lng: 131.036
          label: One
          tooltip: '<div style="color:blue">Hello World!</div>'
        - position:
            lat: -25.348
            lng: 131.038
          label: Two
  ```

<!--  TODO:
2. Add a marker:

   ```yaml
   - id: google_maps
     type: GoogleMaps
     properties:
       bootstrapURLKeys:
         key: ''
         libraries: ['visualization']
       mapOptions:
         panControl: true
         zoomControl: true
         fullscreenControl: true
       zoom: 14
       center:
         lat: -25.344
         lng: 131.036
     events:
       onClick:
         - id: add_marker
           type: CallMethod
           params:
             blockId: google_maps
             method: addMarker
             args:
               - position:
                   lat:
                     _event: lat
                   lng:
                     _event: lng
                 label: Hi
   ```

3. Remove a marker:

   ```yaml
   - id: google_maps
     type: GoogleMaps
     properties:
       bootstrapURLKeys:
         key: ''
         libraries: ['visualization']
       mapOptions:
         panControl: true
         zoomControl: true
         fullscreenControl: true
       zoom: 14
       center:
         lat: -25.344
         lng: 131.036
     events:
       onClickMarker:
         - id: set_click
           type: SetState
           params:
             latLng:
               _event: latLng
         - id: remove_marker
           type: CallMethod
           params:
             blockId: google_maps
             method: removeMarker
             args:
               - position:
                   lat:
                     _state: latLng.lat
                   lng:
                     _state: latLng.lng
   ```

4. Fit bounds:

   ```yaml
   - id: google_maps
     type: GoogleMaps
     properties:
       bootstrapURLKeys:
         key: ''
         libraries: ['visualization']
       mapOptions:
         panControl: true
         zoomControl: true
         fullscreenControl: true
       zoom: 14
       center:
         lat: -25.344
         lng: 131.036
     events:
       onClick:
         - id: fit_bounds
           type: CallMethod
           params:
             blockId: google_maps
             method: fitBounds
             args:
               - ne:
                   lat: 50.01038826014866
                   lng: -118.6525866875
                 sw:
                   lat: 32.698335045970396
                   lng: -92.0217273125
               - width: 640 # Map width in pixels
                 height: 380 # Map height in pixels
   ```
-->

5. Add a heatmap:

  ```yaml
  - id: google_maps
    type: GoogleMaps
    properties:
      apiKey: 'YOUR_API_KEY'
      map:
        disableDefaultUI: true
        zoom: 14
        center:
          lat: -25.344
          lng: 131.036
      heatmap:
        positions:
          - location:
              lat: 34.091158
              lng: -118.2795188
            weight: 1
          - location:
              lat: 34.0771192
              lng: -118.2587199
            weight: 2
          - location:
              lat: 34.083527
              lng: -118.370157
            weight: 1
          - location:
              lat: 34.0951843
              lng: -118.283107
            weight: 2
          - location:
              lat: 34.1033401
              lng: -118.2875469
            weight: 4
          - location:
              lat: 34.035798
              lng: -118.251288
            weight: 2
          - location:
              lat: 34.0776068
              lng: -118.2646526
            weight: 3
          - location:
              lat: 34.0919263
              lng: -118.2820544
            weight: 3
          - location:
              lat: 34.0568525
              lng: -118.3646369
            weight: 3
          - location:
              lat: 34.0285781
              lng: -118.4115541
            weight: 0
          - lat: 34.017339
            lng: -118.278469
            weight: 0
          - location:
              lat: 34.0764288
              lng: -118.3661624
            weight: 4
          - location:
              lat: 33.9925942
              lng: -118.4232475
            weight: 4
          - location:
              lat: 34.0764345
              lng: -118.3730332
            weight: 3
          - location:
              lat: 34.093981
              lng: -118.327638
            weight: 0
          - location:
              lat: 34.056385
              lng: -118.2508724
            weight: 1
          - location:
              lat: 34.107701
              lng: -118.2667943
            weight: 4
          - location:
              lat: 34.0450139
              lng: -118.2388682
            weight: 4
          - location:
              lat: 34.1031997
              lng: -118.2586152
            weight: 1
          - location:
              lat: 34.0828183
              lng: -118.3241586
            weight: 1
        options:
          radius: 20
          opacity: 1
  ```
