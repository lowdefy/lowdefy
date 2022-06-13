# Lowdefy Google Maps Blocks

This repository provides Lowdefy blocks for the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview) is a feature rich javascript map API that lets you customize maps with your own content and imagery for display on web pages and mobile devices.

[google-map-react](https://github.com/google-map-react/google-map-react) is a component written over a small set of the [Google Maps API](https://developers.google.com/maps/).

## Blocks

To use this block, define a [Custom Block type](https://docs.lowdefy.com/custom-blocks) in your Lowdefy app:

```yaml
name: my-app
lowdefy: 3.22.0
types:
  GoogleMaps:
    url: https://blocks-cdn.lowdefy.com/v3.22.0/blocks-google-maps/meta/GoogleMaps.json
# ...
```

### Block type Urls

- `GoogleMaps`: https://blocks-cdn.lowdefy.com/v3.22.0/blocks-google-maps/meta/GoogleMaps.json

### Properties

- `bootstrapURLKeys`: { key: '', language: 'en', region: 'en', libraries: ['places'], ...otherUrlParams, } If you want to include additional libraries to load with the maps api, indicate them in the libraries property of the bootstrapURLKeys object.
- `center`: Can be set to [lat, lng] or { lat: lat, lng: lng}. A position object for the center.
- `debounced`: Defaults to true. Whether map events are debounced.
- `defaultCenter`: Can be set to [lat, lng] or { lat: lat, lng: lng}. A position object for the center.
- `defaultZoom`: Map zoom level.
- `heatmap`: To use the heatmap layer, add visualization to the libraries property array on bootstrapURLKeys and provide the data & configuration for the heatmap in heatmap as props. If you have multiple maps in your project and require a heatmap layer in at least one of them, provide libraries:['visualization'] to all of them.
- `height`: The height of the map block.
- `hoverDistance`: Defaults to 30. Map hover distance.
- `layerTypes`: Examples ['TrafficLayer', 'TransitLayer']. The layer types to be included in the map.
- `mapOptions`: Custom map options.
- `margin`: Map margin.
- `markers`: A list of Markers with properties, `map` is provided by the default by the block, see [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers) for configuration details.
- `resetBoundsOnResize`: Default: false, When true this will reset the map bounds if the parent resizes.
- `style`: Custom map css properties to apply to map block.
- `zoom`: Map zoom level.

### Events

- `onClick`: Trigger onClick actions when the map is clicked, returns `_event` object:
  - `event`: event object
  - `lat`: latitudinal coordinate
  - `lng`: longitudinal coordinate
  - `maps`: has functions removed
  - `x`: position on map block
  - `y`: position on map block
- `onClickMarker`: Trigger onClick actions when a marker is clicked, returns `_event` object:
  - `domEvent`: event object
  - `latLng`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `maps`: has functions removed
  - `pixel`:
    - `x`
    - `y`
- `onDrag`: Trigger onDrag actions when a map is dragged, returns `_event` object:
  - `maps`: has functions removed
- `onDragEnd`: Trigger onDragEnd actions when a map is finished being dragged, returns `_event` object:
  - `maps`: has functions removed
- `onGoogleApiLoaded` Trigger onGoogleApiLoaded actions when the map api is loaded, returns `_event` object:
  - `maps`: has functions removed
- `onMapTypeIdChange`: Trigger onMapTypeIdChange actions when the map type is changed, returns `_event` object:
  - `maps`: has functions removed
  - `type`: the map
- `onTilesLoaded`: Trigger onTilesLoaded actions when the map tiles are loaded, returns `_event` object:
  - `maps`: has functions removed
- `onZoomAnimationStart`: Trigger onZoomAnimationStart actions when the map is zoomed, returns `_event` object:
  - `maps`: has functions removed
  - `zoom`: map zoom level
- `onZoomAnimationEnd`: Trigger onZoomAnimationEnd actions after the map is zoomed, returns `_event` object:
  - `maps`: has functions removed
  - `zoom`: map zoom level

### Methods

- `addMarker`: Accepts a single parameter object `marker` with marker properties.
- `removeMarker`: Accepts a single parameter object `marker` with position property.
- `fitBounds`: Accepts a two parameters, `bounds` and `mapSize`.
- `addHeatmap`: Accepts a single parameter object `heatmap` with heatmap properties.
- `toggleHeatmap`: Doesn't require any parameters.

## Examples

1. Add a list of markers, one with a tooltip:

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

5. Add a heatmap:

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
       zoom: 10
       center:
         lat: 34.0522
         lng: -118.2437
       heatmap:
         positions:
           - lat: 34.091158
             lng: -118.2795188
             weight: 1
           - lat: 34.0771192
             lng: -118.2587199
             weight: 2
           - lat: 34.083527
             lng: -118.370157
             weight: 1
           - lat: 34.0951843
             lng: -118.283107
             weight: 2
           - lat: 34.1033401
             lng: -118.2875469
             weight: 4
           - lat: 34.035798
             lng: -118.251288
             weight: 2
           - lat: 34.0776068
             lng: -118.2646526
             weight: 3
           - lat: 34.0919263
             lng: -118.2820544
             weight: 3
           - lat: 34.0568525
             lng: -118.3646369
             weight: 3
           - lat: 34.0285781
             lng: -118.4115541
             weight: 0
           - lat: 34.017339
             lng: -118.278469
             weight: 0
           - lat: 34.0764288
             lng: -118.3661624
             weight: 4
           - lat: 33.9925942
             lng: -118.4232475
             weight: 4
           - lat: 34.0764345
             lng: -118.3730332
             weight: 3
           - lat: 34.093981
             lng: -118.327638
             weight: 0
           - lat: 34.056385
             lng: -118.2508724
             weight: 1
           - lat: 34.107701
             lng: -118.2667943
             weight: 4
           - lat: 34.0450139
             lng: -118.2388682
             weight: 4
           - lat: 34.1031997
             lng: -118.2586152
             weight: 1
           - lat: 34.0828183
             lng: -118.3241586
             weight: 1
         options:
           radius: 20
           opacity: 1
   ```

6. Add a heatmap after api has loaded:

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
       zoom: 10
       center:
         lat: 34.0522
         lng: -118.2437
     events:
       onMountAsync:
         - id: add_heatmap
           type: CallMethod
           params:
             blockId: google_maps
             method: addHeatmap
             args:
               - data:
                   - location:
                       lat: 34.091158
                       lng: -118.2795188
                     weight: 1
                   - location:
                       lat: 34.0771192
                       lng: -118.2587199
                     weight: 2
                   - location:
                       lat: 34.0828183
                       lng: -118.3241586
                     weight: 1
                 radius: 20
                 opacity: 1
   ```

7. Toggle a heatmap

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
       zoom: 10
       center:
         lat: 34.0522
         lng: -118.2437
     events:
       onClick:
         - id: toggle_heatmap
           type: CallMethod
           params:
             blockId: google_maps
             method: toggleHeatmap
   ```
