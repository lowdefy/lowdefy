# GoogleMapsHeatmap

Google Map with a heatmap visualization layer for displaying data density. Must be wrapped in a `GoogleMapsScript` block with `libraries: [visualization]`. Supports weighted data points, configurable radius and opacity, markers, and info windows.

> The GoogleMapsHeatmap block must be wrapped in a GoogleMapsScript block with a valid Google Maps API key and the visualization library. The examples on this page require a configured API key to render maps.

```yaml
- id: heatmap_basic
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 37.775
        lng: -122.434
      zoom: 13
    heatmap:
      data:
        - lat: 37.782
          lng: -122.447
        - lat: 37.782
          lng: -122.445
        - lat: 37.782
          lng: -122.443
        - lat: 37.784
          lng: -122.441
        - lat: 37.786
          lng: -122.439
        - lat: 37.786
          lng: -122.435
        - lat: 37.77
          lng: -122.432
        - lat: 37.768
          lng: -122.43
```

```yaml
- id: heatmap_zoomed_out
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 51.509
        lng: -0.118
      zoom: 10
    heatmap:
      data:
        - lat: 51.512
          lng: -0.091
        - lat: 51.507
          lng: -0.076
        - lat: 51.503
          lng: -0.119
        - lat: 51.515
          lng: -0.142
- id: heatmap_zoomed_in
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 51.509
        lng: -0.118
      zoom: 15
    heatmap:
      data:
        - lat: 51.512
          lng: -0.091
        - lat: 51.507
          lng: -0.076
        - lat: 51.503
          lng: -0.119
        - lat: 51.515
          lng: -0.142
```

```yaml
- id: heatmap_map_options
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 40.7128
        lng: -74.006
      zoom: 12
      options:
        mapTypeId: satellite
        disableDefaultUI: true
    heatmap:
      data:
        - lat: 40.7128
          lng: -74.006
        - lat: 40.72
          lng: -73.998
        - lat: 40.706
          lng: -74.01
        - lat: 40.718
          lng: -73.99
```

```yaml
- id: heatmap_weighted
  type: GoogleMapsHeatmap
  properties:
    autoBounds: false
    map:
      center:
        lat: 51.509
        lng: -0.118
      zoom: 13
    heatmap:
      data:
        - location:
            lat: 51.512
            lng: -0.091
          weight: 10
        - location:
            lat: 51.507
            lng: -0.076
          weight: 5
        - location:
            lat: 51.503
            lng: -0.119
          weight: 8
        - location:
            lat: 51.515
            lng: -0.142
          weight: 3
        - location:
            lat: 51.52
            lng: -0.105
          weight: 7
```

```yaml
- id: heatmap_radius_small
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 40.7128
        lng: -74.006
      zoom: 12
    heatmap:
      radius: 15
      data:
        - lat: 40.7128
          lng: -74.006
        - lat: 40.72
          lng: -73.998
        - lat: 40.706
          lng: -74.01
        - lat: 40.718
          lng: -73.99
        - lat: 40.71
          lng: -74.015
- id: heatmap_radius_large
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 40.7128
        lng: -74.006
      zoom: 12
    heatmap:
      radius: 50
      data:
        - lat: 40.7128
          lng: -74.006
        - lat: 40.72
          lng: -73.998
        - lat: 40.706
          lng: -74.01
        - lat: 40.718
          lng: -73.99
        - lat: 40.71
          lng: -74.015
- id: heatmap_opacity_low
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 34.0522
        lng: -118.2437
      zoom: 12
    heatmap:
      opacity: 0.3
      data:
        - lat: 34.0522
          lng: -118.2437
        - lat: 34.06
          lng: -118.25
        - lat: 34.048
          lng: -118.235
        - lat: 34.055
          lng: -118.26
- id: heatmap_opacity_full
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 34.0522
        lng: -118.2437
      zoom: 12
    heatmap:
      opacity: 1
      data:
        - lat: 34.0522
          lng: -118.2437
        - lat: 34.06
          lng: -118.25
        - lat: 34.048
          lng: -118.235
        - lat: 34.055
          lng: -118.26
```

```yaml
- id: heatmap_no_auto_bounds
  type: GoogleMapsHeatmap
  properties:
    autoBounds: false
    map:
      center:
        lat: 35.6762
        lng: 139.6503
      zoom: 11
    heatmap:
      data:
        - lat: 35.6812
          lng: 139.7671
        - lat: 35.6595
          lng: 139.7005
        - lat: 35.6938
          lng: 139.7034
        - lat: 35.6586
          lng: 139.7454
```

```yaml
- id: heatmap_with_markers
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 13
    markers:
      - position:
          lat: 48.8584
          lng: 2.2945
        label: A
      - position:
          lat: 48.8606
          lng: 2.3376
        label: B
      - position:
          lat: 48.853
          lng: 2.3499
        label: C
    heatmap:
      radius: 25
      data:
        - lat: 48.8584
          lng: 2.2945
        - lat: 48.8606
          lng: 2.3376
        - lat: 48.853
          lng: 2.3499
        - lat: 48.862
          lng: 2.332
        - lat: 48.8566
          lng: 2.3522
```

```yaml
- id: heatmap_custom_style
  type: GoogleMapsHeatmap
  properties:
    style:
      width: 100%
      height: 500px
    map:
      center:
        lat: -33.8688
        lng: 151.2093
      zoom: 12
    heatmap:
      radius: 30
      data:
        - lat: -33.8688
          lng: 151.2093
        - lat: -33.856
          lng: 151.2153
        - lat: -33.875
          lng: 151.2
        - lat: -33.861
          lng: 151.21
```

```yaml
- id: heatmap_events
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 13
    markers:
      - position:
          lat: 48.8584
          lng: 2.2945
        label: A
      - position:
          lat: 48.8606
          lng: 2.3376
        label: B
    heatmap:
      data:
        - lat: 48.8584
          lng: 2.2945
        - lat: 48.8606
          lng: 2.3376
        - lat: 48.8566
          lng: 2.3522
  events:
    onClick:
      - id: heatmap_click_display
        type: DisplayMessage
        params:
          content: Map clicked!
          status: info
    onMarkerClick:
      - id: heatmap_marker_click_msg
        type: DisplayMessage
        params:
          content: Marker clicked!
          status: success
    onZoomChanged:
      - id: heatmap_zoom_set_state
        type: SetState
        params:
          currentZoom:
            _event: zoom
```

```yaml
- id: heatmap_events
  type: GoogleMapsHeatmap
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 13
    markers:
      - position:
          lat: 48.8584
          lng: 2.2945
        label: A
      - position:
          lat: 48.8606
          lng: 2.3376
        label: B
    heatmap:
      data:
        - lat: 48.8584
          lng: 2.2945
        - lat: 48.8606
          lng: 2.3376
        - lat: 48.8566
          lng: 2.3522
  events:
    onClick:
      - id: heatmap_click_display
        type: DisplayMessage
        params:
          content: Map clicked!
          status: info
    onMarkerClick:
      - id: heatmap_marker_click_msg
        type: DisplayMessage
        params:
          content: Marker clicked!
          status: success
    onZoomChanged:
      - id: heatmap_zoom_set_state
        type: SetState
        params:
          currentZoom:
            _event: zoom
```

```yaml
- id: heatmap_css_element
  type: GoogleMapsHeatmap
  class:
    element: rounded-xl shadow-lg border-2 border-blue-300
  properties:
    map:
      center:
        lat: 37.775
        lng: -122.434
      zoom: 13
    heatmap:
      data:
        - lat: 37.782
          lng: -122.447
        - lat: 37.782
          lng: -122.445
        - lat: 37.784
          lng: -122.441
        - lat: 37.786
          lng: -122.435
- id: heatmap_css_rounded_shadow
  type: GoogleMapsHeatmap
  class:
    element: rounded-2xl shadow-2xl overflow-hidden
  properties:
    style:
      height: 350px
    map:
      center:
        lat: 51.509
        lng: -0.118
      zoom: 13
    heatmap:
      data:
        - lat: 51.512
          lng: -0.091
        - lat: 51.507
          lng: -0.076
        - lat: 51.503
          lng: -0.119
```

Store Foot Traffic Analysis

Visualizing customer activity density across downtown locations. Higher intensity areas indicate more foot traffic during peak hours.

```yaml
- id: store_dashboard_title
  type: Title
  properties:
    content: Store Foot Traffic Analysis
    level: 3
- id: store_dashboard_desc
  type: Paragraph
  properties:
    content: Visualizing customer activity density across downtown locations. Higher
      intensity areas indicate more foot traffic during peak hours.
- id: store_dashboard_map
  type: GoogleMapsHeatmap
  class:
    element: rounded-lg shadow-md
  properties:
    style:
      height: 450px
    map:
      center:
        lat: 40.758
        lng: -73.9855
      zoom: 14
    markers:
      - position:
          lat: 40.7614
          lng: -73.9776
        label: S1
      - position:
          lat: 40.7549
          lng: -73.984
        label: S2
      - position:
          lat: 40.7587
          lng: -73.99
        label: S3
    heatmap:
      radius: 35
      opacity: 0.7
      data:
        - lat: 40.7614
          lng: -73.9776
        - lat: 40.76
          lng: -73.979
        - lat: 40.759
          lng: -73.98
        - lat: 40.7549
          lng: -73.984
        - lat: 40.756
          lng: -73.983
        - lat: 40.7587
          lng: -73.99
        - lat: 40.7575
          lng: -73.987
  events:
    onMarkerClick:
      - id: store_marker_click_msg
        type: DisplayMessage
        params:
          content: Click a store marker to view detailed foot traffic analytics.
          status: info
```

Real-time air quality index readings from distributed sensor stations. Warmer areas on the heatmap indicate higher pollutant concentrations. Markers show individual sensor locations.

```yaml
- id: sensor_network_card
  type: Card
  properties:
    title: Air Quality Monitoring - San Francisco Bay Area
  slots:
    extra:
      blocks:
        - id: sensor_network_refresh_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Refresh Data
            icon: AiOutlineReload
            color: primary
            variant: outlined
            size: small
          events:
            onClick:
              - id: sensor_refresh_msg
                type: DisplayMessage
                params:
                  content: Sensor data refreshed.
                  status: success
  blocks:
    - id: sensor_network_desc
      type: Paragraph
      properties:
        content: Real-time air quality index readings from distributed sensor stations.
          Warmer areas on the heatmap indicate higher pollutant concentrations.
          Markers show individual sensor locations.
    - id: sensor_network_map
      type: GoogleMapsHeatmap
      class:
        element: rounded-lg
      properties:
        autoBounds: false
        style:
          height: 500px
        map:
          center:
            lat: 37.775
            lng: -122.418
          zoom: 12
          options:
            mapTypeControl: false
            streetViewControl: false
        markers:
          - position:
              lat: 37.7849
              lng: -122.4094
            label: "1"
          - position:
              lat: 37.7694
              lng: -122.4862
            label: "2"
          - position:
              lat: 37.7599
              lng: -122.4148
            label: "3"
          - position:
              lat: 37.7909
              lng: -122.4
            label: "4"
          - position:
              lat: 37.775
              lng: -122.435
            label: "5"
        heatmap:
          radius: 40
          opacity: 0.6
          data:
            - lat: 37.7849
              lng: -122.4094
            - lat: 37.7694
              lng: -122.4862
            - lat: 37.7599
              lng: -122.4148
            - lat: 37.7909
              lng: -122.4
            - lat: 37.775
              lng: -122.435
            - lat: 37.78
              lng: -122.42
            - lat: 37.772
              lng: -122.45
      events:
        onMarkerClick:
          - id: sensor_marker_click_msg
            type: DisplayMessage
            params:
              content: Select a sensor station to view detailed air quality readings.
              status: info
        onClick:
          - id: sensor_map_click_set
            type: SetState
            params:
              selectedLocation:
                _event: latLng
```

```yaml
- id: sensor_network_card
  type: Card
  properties:
    title: Air Quality Monitoring - San Francisco Bay Area
  slots:
    extra:
      blocks:
        - id: sensor_network_refresh_btn
          type: Button
          layout:
            flex: 0 0 auto
          properties:
            title: Refresh Data
            icon: AiOutlineReload
            color: primary
            variant: outlined
            size: small
          events:
            onClick:
              - id: sensor_refresh_msg
                type: DisplayMessage
                params:
                  content: Sensor data refreshed.
                  status: success
  blocks:
    - id: sensor_network_desc
      type: Paragraph
      properties:
        content: Real-time air quality index readings from distributed sensor stations.
          Warmer areas on the heatmap indicate higher pollutant concentrations.
          Markers show individual sensor locations.
    - id: sensor_network_map
      type: GoogleMapsHeatmap
      class:
        element: rounded-lg
      properties:
        autoBounds: false
        style:
          height: 500px
        map:
          center:
            lat: 37.775
            lng: -122.418
          zoom: 12
          options:
            mapTypeControl: false
            streetViewControl: false
        markers:
          - position:
              lat: 37.7849
              lng: -122.4094
            label: "1"
          - position:
              lat: 37.7694
              lng: -122.4862
            label: "2"
          - position:
              lat: 37.7599
              lng: -122.4148
            label: "3"
          - position:
              lat: 37.7909
              lng: -122.4
            label: "4"
          - position:
              lat: 37.775
              lng: -122.435
            label: "5"
        heatmap:
          radius: 40
          opacity: 0.6
          data:
            - lat: 37.7849
              lng: -122.4094
            - lat: 37.7694
              lng: -122.4862
            - lat: 37.7599
              lng: -122.4148
            - lat: 37.7909
              lng: -122.4
            - lat: 37.775
              lng: -122.435
            - lat: 37.78
              lng: -122.42
            - lat: 37.772
              lng: -122.45
      events:
        onMarkerClick:
          - id: sensor_marker_click_msg
            type: DisplayMessage
            params:
              content: Select a sensor station to view detailed air quality readings.
              status: info
        onClick:
          - id: sensor_map_click_set
            type: SetState
            params:
              selectedLocation:
                _event: latLng
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoBounds` | boolean | `true` | Automatically fit the map bounds to include all markers and heatmap data points. |
| `map` | object | - | Map settings object. |
| `map.center` | object | - | A coordinate position object by which to center the map. |
| `map.center.lat` | number | - | Lateral coordinate. |
| `map.center.lng` | number | - | Longitudinal coordinate. |
| `map.zoom` | number | - | Map zoom level. |
| `map.options` | object | - | Map options. See [Google Maps MapOptions](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions). |
| `heatmap` | object | - | Heatmap layer options. See [heatmap options](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions). |
| `heatmap.data` | array | - | A list of heatmap data points. |
| `heatmap.data.$.lat` | number | - | Lateral coordinate. |
| `heatmap.data.$.lng` | number | - | Longitudinal coordinate. |
| `heatmap.data.$.weight` | number | - | Item weight on heatmap. |
| `heatmap.radius` | number | - | The radius of influence for each data point, in pixels. |
| `heatmap.opacity` | number | - | The opacity of the heatmap, from 0 to 1. |
| `markers` | array | - | A list of markers with marker options. See [Google Maps Markers](https://developers.google.com/maps/documentation/javascript/markers). |
| `markers.$.position` | object | - |  |
| `markers.$.position.lat` | number | - | Lateral coordinate. |
| `markers.$.position.lng` | number | - | Longitudinal coordinate. |
| `markers.$.label` | string | - | Label displayed on marker. |
| `infoWindow` | object | - | Info window options. See [InfoWindowOptions](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions). |
| `infoWindow.visible` | boolean | - | When visible is true, blocks inside the infoWindow content area will be rendered. |
| `infoWindow.position` | object | - |  |
| `infoWindow.position.lat` | number | - | Lateral coordinate. |
| `infoWindow.position.lng` | number | - | Longitudinal coordinate. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onClick` | \- | Trigger actions when the map is clicked. |
| `onMarkerClick` | \- | Trigger actions when a marker is clicked. |
| `onZoomChanged` | \- | Trigger actions when the zoom on the map is changed. |
| `onBoundsChanged` | \- | Trigger actions when the bounds of the map are changed. |
| `onCenterChanged` | \- | Trigger actions when the center of the map is changed. |
| `onInfoWindowCloseClick` | \- | Trigger actions when the info window close button is clicked. |
| `onInfoWindowPositionChanged` | \- | Trigger actions when the info window position changes. |
| `onLoad` | \- | Trigger actions when the map is loaded. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The map container element. |

| Slot | Description |
| --- | --- |
| `content` | Marker blocks on the map. |
| `infoWindow` | Info window popup content. |
