# Lowdefy Google Maps Blocks

This is a Lowdefy blocks wrapper for this the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).

To use this block, define a [@googlemaps/react-wrapper](https://www.npmjs.com/package/@googlemaps/react-wrapper). It currently implements:

- [Map](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)
- [Heatmap](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions)
- [Markers](https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions)
- [Marker Clusterers](https://developers.google.com/maps/documentation/javascript/marker-clustering)

### Properties

- `apiKey: string`: Your Google Maps API key.
- `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).
- `map: mapOptions`: All [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
  - `center: { lat: number, lng: number }`: A coordinate position object by which to center the map.
  - `zoom: number`: Map zoom level.
  - `options: mapOptions`: All other [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
- `heatmap: heatmapOptions`: Add a heatmap layer, see more [heatmap options](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions). This will automatically load the `visualization` library, which must be added to the list of libraries in the `libraries` property of the `GoogleMapsScript` block.
  - `data: { lat: number, lng: number, weight: number } []`: A list of heatmap data points.
- `style: cssObject`: A style object applied to the map element.
- `markers: markerOptions[]`: A list of Markers with marker options, see more [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers).
  - `position: { lat: number, lng: number }`: Position of marker on map.
  - `label: string`: Label displayed on marker.
- `markerClusterers: markerClustererOptions[]`: A list of MarkerClusterers with marker clusterer options.
  - `markers: markerOptions[]`: A list of Markers with marker options, see more [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers).
    - `position: { lat: number, lng: number }`: Position of marker on map.
    - `label: string`: Label displayed on marker.
  - `options: markerClustererOptions`: All other [marker clusterer options](https://react-google-maps-api-docs.netlify.app/#markerclusterer).
- `infoWindow: infoWindowOptions`: All infoWindow options, see [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions).
  - `position: { lat: number, lng: number }`: Position of infoWindow on map.
  - `visible: boolean`: When visible is true, blocks inside infoWindow content area will be rendered.

### Events

- `onBoundsChanged`: Trigger onBoundsChanged actions when the bounds of the map are changed, returns `_event`
object:
  - `bounds`:
    - `east`: latitudinal coordinate
    - `north`: longitudinal coordinate
    - `south`: longitudinal coordinate
    - `west`: latitudinal coordinate
  - `center`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `zoom`: zoom level
- `onCenterChanged`: Trigger onCenterChanged actions when the center of the map is changed, returns `_event`
object:
  - `bounds`:
    - `east`: latitudinal coordinate
    - `north`: longitudinal coordinate
    - `south`: longitudinal coordinate
    - `west`: latitudinal coordinate
  - `center`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `zoom`: zoom level
- `onClick`: Trigger onClick actions when the map is clicked, returns `_event` object:
  - `domEvent`: event object
  - `latLng`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `pixel`:
    - `x`: x position on map block
    - `y`: y position on map block
- `onClusterClick`: Trigger onClusterClick actions when a cluster is clicked, returns `_event`
- `onMarkerClick`: Trigger onMarkerClick actions when a marker is clicked, returns `_event`
object:
  - `domEvent`: event object
  - `latLng`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `pixel`:
    - `x`: x position on map block
    - `y`: y position on map block
- `onZoomChanged`: Trigger onZoomChanged actions when the zoom on the map is changed. returns `_event`
object:
  - `bounds`:
    - `east`: latitudinal coordinate
    - `north`: longitudinal coordinate
    - `south`: longitudinal coordinate
    - `west`: latitudinal coordinate
  - `center`:
    - `lat`: latitudinal coordinate
    - `lng`: longitudinal coordinate
  - `zoom`: zoom level

### Methods

- `fitBounds`: Fit map to given bounds.
  - `bounds: { lat: number, lng: number } []`: A list of the coordinate positions of the boundary points.
  - `zoom: number`: Map zoom level.
- `getBounds`: Returns the bounds of the map.
- `getCenter`: Returns the center of the map.
- `getZoom`: Returns the zoom of the map.

## Examples

1. Add markers:

    ```yaml
    - id: google_maps_script_1
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_1
          type: GoogleMaps
          properties:
            map:
              options:
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
              - position:
                  lat: -25.348
                  lng: 131.038
                label: Two
    ```

2. Automatically bound map around marker positions when zoom and center map properties are left out:

    ```yaml
    - id: google_maps_script_2
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_2
          type: GoogleMaps
          properties:
            map:
              options:
                panControl: true
                zoomControl: true
                fullscreenControl: true
            markers:
              - position:
                  lat: -25.344
                  lng: 131.036
                label: One
              - position:
                  lat: -25.348
                  lng: 131.038
                label: Two
    ```

3. Add tooltips by making use of infoWindow:

    ```yaml
    - id: google_maps_script_3
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_3
          type: GoogleMaps
          properties:
            map:
              options:
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
              - position:
                  lat: -25.348
                  lng: 131.038
                label: Two
            infoWindow:
              position:
                _state: position
              visible:
                _state: show_info
          events:
            onMarkerClick:
              - id: set
                type: SetState
                params:
                  show_info:
                    _not:
                      _state: show_info
                  position:
                    _event: latLng
          areas:
            infoWindow:
              blocks:
                - id: content
                  type: Html
                  properties:
                    html:
                      _nunjucks:
                        template: |
                          <h1>Lat: {{ position.lat }} Lng: {{ position.lng }} </h1>
                        on:
                          _state: true
    ```

4. Add markers with onClick event:

    ```yaml
    - id: google_maps_script_4
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_4
            type: GoogleMaps
            properties:
              map:
                options:
                  panControl: true
                  zoomControl: true
                  fullscreenControl: true
                center:
                  lat: -25.344
                  lng: 131.036
                zoom: 5
              markers:
                _state: markers_list
            events:
              onClick:
                - id: markers_list
                  type: SetState
                  params:
                    markers_list:
                      _array.concat:
                        - - position:
                              _event: latLng
                            label: Hi
                        - _if_none:
                            - _state: markers_list
                            - []
    ```

5. Add a heatmap:

    ```yaml
    - id: google_maps_script_5
      type: GoogleMapsScript
      properties:
        libraries:
          - visualization
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_5
          type: GoogleMapsHeatmap
          properties:
            map:
              disableDefaultUI: true
            heatmap:
              data:
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

6. Trigger fitBounds using a Button:

    ```yaml
    - id: google_maps_script_6
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: btn
          type: Button
          events:
            onClick:
              - id: set_boundaries
                type: CallMethod
                params:
                  blockId: google_maps_6
                  method: fitBounds
                  args:
                    - bounds:
                        - lat: -25.344
                          lng: 131.036
                        - lat: -25.348
                          lng: 131.038
                      zoom: 10

        - id: google_maps_6
          type: GoogleMaps
          properties:
            map:
              zoom: 5
              center:
                lat: -35.344
                lng: 31.036
    ```

7. Add a marker clusterer:

    ```yaml
    - id: google_maps_script_7
      type: GoogleMapsScript
      properties:
        libraries:
          - visualization
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_7
          type: GoogleMaps
          properties:
            map:
              disableDefaultUI: true
            markerClusterers:
              - markers:
                  - position:
                      lat: 34.091158
                      lng: -118.2795188
                  - position:
                      lat: 34.0771192
                      lng: -118.2587199
                  - position:
                      lat: 34.083527
                      lng: -118.370157
                  - position:
                      lat: 34.0951843
                      lng: -118.283107
                  - position:
                      lat: 34.1033401
                      lng: -118.2875469
                  - position:
                      lat: 34.035798
                      lng: -118.251288
                  - position:
                      lat: 34.0776068
                      lng: -118.2646526
                  - position:
                      lat: 34.0919263
                      lng: -118.2820544
                  - position:
                      lat: 34.0568525
                      lng: -118.3646369
                  - position:
                      lat: 34.0285781
                      lng: -118.4115541
                  - position:
                      lat: 34.017339
                      lng: -118.278469
                  - position:
                      lat: 34.0764288
                      lng: -118.3661624
                  - position:
                      lat: 33.9925942
                      lng: -118.4232475
                  - position:
                      lat: 34.0764345
                      lng: -118.3730332
                  - position:
                      lat: 34.093981
                      lng: -118.327638
                  - position:
                      lat: 34.056385
                      lng: -118.2508724
                  - position:
                      lat: 34.107701
                      lng: -118.2667943
                  - position:
                      lat: 34.0450139
                      lng: -118.2388682
                  - position:
                      lat: 34.1031997
                      lng: -118.2586152
                  - position:
                      lat: 34.0828183
                      lng: -118.3241586
                options:
                  averageCenter: true
                  zoomOnClick: false
                  minimumClusterSize: 3
                  maxZoom: 13
    ```

8. Call method getZoom:

    ```yaml
    - id: google_maps_script_8
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_8
          type: GoogleMaps
          properties:
            map:
              options:
                panControl: true
                zoomControl: true
                fullscreenControl: true
              zoom: 14
              center:
                lat: -25.344
                lng: 131.036
          events:
            onClick:
              - id: get_zoom
                type: CallMethod
                params:
                  blockId: google_maps_8
                  method: getZoom
              - id: get_zoom_result
                type: SetState
                params:
                  zoom:
                    _actions: get_zoom.response
    ```
<!--
7. Trigger fitBounds using the onLoad event:

    ```yaml
    - id: google_maps_script_7
      type: GoogleMapsScript
      properties:
        apiKey:
          _build.env: GOOGLE_MAPS_API_KEY
      blocks:
        - id: google_maps_7
          type: GoogleMaps
          properties:
            map:
              zoom: 5
              center:
                lat: -35.344
                lng: 31.036
          events:
            onLoad:
              - id: set_boundaries
                type: CallMethod
                params:
                  blockId: google_maps_7
                  method: fitBounds
                  args:
                    - bounds:
                        - lat: -25.344
                          lng: 131.036
                      zoom: 10
    ``` -->
