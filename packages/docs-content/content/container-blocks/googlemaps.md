# GoogleMaps

Interactive Google Map with markers, info windows, marker clusterers, and heatmap layer. Must be wrapped in a `GoogleMapsScript` block. Supports auto-bounding, custom map styles, and events for clicks, zoom changes, and marker interactions.

> The GoogleMaps block must be wrapped in a GoogleMapsScript block with a valid Google Maps API key. The examples on this page require a configured API key to render maps.

```yaml
- id: gm_default
  type: GoogleMaps
```

```yaml
- id: gm_center_paris
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 14
```

```yaml
- id: gm_type_satellite
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 37.7749
        lng: -122.4194
      zoom: 13
      mapTypeId: satellite
```

```yaml
- id: gm_no_default_ui
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 34.0522
        lng: -118.2437
      zoom: 10
      disableDefaultUI: true
- id: gm_selective_controls
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 34.0522
        lng: -118.2437
      zoom: 10
      zoomControl: false
      streetViewControl: false
      fullscreenControl: true
      mapTypeControl: false
```

```yaml
- id: gm_single_marker
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 14
    markers:
      - position:
          lat: 48.8584
          lng: 2.2945
        label: E
        title: Eiffel Tower
```

```yaml
- id: gm_multi_markers
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 40.7484
        lng: -73.9857
      zoom: 12
    markers:
      - position:
          lat: 40.6892
          lng: -74.0445
        label: A
        title: Statue of Liberty
      - position:
          lat: 40.7484
          lng: -73.9857
        label: B
        title: Empire State Building
      - position:
          lat: 40.7589
          lng: -73.9851
        label: C
        title: Times Square
      - position:
          lat: 40.7527
          lng: -73.9772
        label: D
        title: Grand Central Terminal
```

```yaml
- id: gm_clusterer_basic
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 51.51
        lng: -0.13
      zoom: 12
    markerClusterers:
      - markers:
          - position:
              lat: 51.5074
              lng: -0.1278
          - position:
              lat: 51.5155
              lng: -0.1419
          - position:
              lat: 51.5014
              lng: -0.1419
          - position:
              lat: 51.5194
              lng: -0.127
          - position:
              lat: 51.5033
              lng: -0.1195
- id: gm_clusterer_options
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 51.51
        lng: -0.13
      zoom: 10
    markerClusterers:
      - markers:
          - position:
              lat: 51.5074
              lng: -0.1278
          - position:
              lat: 51.5155
              lng: -0.1419
          - position:
              lat: 51.5014
              lng: -0.1419
          - position:
              lat: 51.5194
              lng: -0.127
          - position:
              lat: 51.5033
              lng: -0.1195
          - position:
              lat: 51.49
              lng: -0.14
          - position:
              lat: 51.525
              lng: -0.11
        options:
          averageCenter: true
          gridSize: 60
          minimumClusterSize: 3
          zoomOnClick: true
```

```yaml
- id: gm_info_window
  type: GoogleMaps
  properties:
    map:
      center:
        lat: -33.8568
        lng: 151.2153
      zoom: 15
    markers:
      - position:
          lat: -33.8568
          lng: 151.2153
        title: Sydney Opera House
    infoWindow:
      position:
        lat: -33.8568
        lng: 151.2153
```

```yaml
- id: gm_auto_bounds_enabled
  type: GoogleMaps
  properties:
    markers:
      - position:
          lat: 48.8566
          lng: 2.3522
        label: Paris
      - position:
          lat: 35.6762
          lng: 139.6503
        label: Tokyo
      - position:
          lat: -33.8688
          lng: 151.2093
        label: Sydney
- id: gm_auto_bounds_disabled
  type: GoogleMaps
  properties:
    autoBounds: false
    map:
      center:
        lat: 0
        lng: 0
      zoom: 2
    markers:
      - position:
          lat: 48.8566
          lng: 2.3522
      - position:
          lat: 35.6762
          lng: 139.6503
```

```yaml
- id: gm_custom_style_tall
  type: GoogleMaps
  properties:
    style:
      height: 500px
    map:
      center:
        lat: 40.7128
        lng: -74.006
      zoom: 12
- id: gm_custom_style_compact
  type: GoogleMaps
  properties:
    style:
      height: 200px
    map:
      center:
        lat: 51.5074
        lng: -0.1278
      zoom: 10
```

```yaml
- id: gm_heatmap
  type: GoogleMaps
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
          weight: 3
        - lat: 37.782
          lng: -122.445
          weight: 2
        - lat: 37.782
          lng: -122.443
          weight: 5
        - lat: 37.78
          lng: -122.44
          weight: 1
        - lat: 37.779
          lng: -122.438
          weight: 4
        - lat: 37.774
          lng: -122.43
          weight: 2
        - lat: 37.77
          lng: -122.425
          weight: 3
```

```yaml
- id: gm_events_click
  type: GoogleMaps
  properties:
    map:
      center:
        lat: 51.5074
        lng: -0.1278
      zoom: 12
    markers:
      - position:
          lat: 51.5074
          lng: -0.1278
        label: A
        title: Central London
  events:
    onClick:
      - id: gm_click_action
        type: DisplayMessage
        params:
          content: Map clicked!
          duration: 3
    onMarkerClick:
      - id: gm_marker_click_action
        type: DisplayMessage
        params:
          content: Marker clicked!
          duration: 3
    onZoomChanged:
      - id: gm_zoom_action
        type: SetState
        params:
          lastZoomEvent: zoom level changed
```

```yaml
- id: gm_tailwind_rounded
  type: GoogleMaps
  class: rounded-xl overflow-hidden shadow-lg
  properties:
    map:
      center:
        lat: 48.8566
        lng: 2.3522
      zoom: 13
- id: gm_tailwind_bordered
  type: GoogleMaps
  class: rounded-lg border-2 border-blue-400 shadow-md
  properties:
    map:
      center:
        lat: 35.6762
        lng: 139.6503
      zoom: 12
```

```yaml
- id: gm_css_key_element
  type: GoogleMaps
  class:
    element: rounded-2xl overflow-hidden shadow-xl border border-gray-200
  properties:
    map:
      center:
        lat: 40.4168
        lng: -3.7038
      zoom: 13
```

Coffee Shop Locations

Find your nearest branch. Click a marker for details.

```yaml
- id: gm_store_locator_title
  type: Title
  properties:
    content: Coffee Shop Locations
    level: 4
- id: gm_store_locator_description
  type: Paragraph
  properties:
    content: Find your nearest branch. Click a marker for details.
- id: gm_store_locator_map
  type: GoogleMaps
  class: rounded-lg overflow-hidden shadow-md
  properties:
    style:
      height: 400px
    map:
      center:
        lat: 40.758
        lng: -73.9855
      zoom: 14
    markers:
      - position:
          lat: 40.7614
          lng: -73.9776
        label: "1"
        title: 5th Avenue Branch
      - position:
          lat: 40.7549
          lng: -73.984
        label: "2"
        title: Times Square Branch
      - position:
          lat: 40.7527
          lng: -73.9772
        label: "3"
        title: Grand Central Branch
  events:
    onMarkerClick:
      - id: gm_store_locator_marker_click
        type: DisplayMessage
        params:
          content: Loading branch details...
          duration: 2
```

Active Deliveries

```yaml
- id: gm_delivery_header
  type: Box
  layout:
    gap: 16
    align: center
  blocks:
    - id: gm_delivery_title
      type: Title
      layout:
        flex: 1 1 0
      properties:
        content: Active Deliveries
        level: 4
    - id: gm_delivery_count
      type: Tag
      layout:
        flex: 0 0 auto
      properties:
        title: 4 in transit
        color: processing
- id: gm_delivery_map
  type: GoogleMaps
  class: rounded-lg overflow-hidden border border-gray-200
  properties:
    style:
      height: 450px
    map:
      center:
        lat: 51.51
        lng: -0.12
      zoom: 12
    markers:
      - position:
          lat: 51.5225
          lng: -0.0835
        label: "1"
        title: "Order #1042 - En route"
      - position:
          lat: 51.5074
          lng: -0.1278
        label: "2"
        title: "Order #1043 - Arriving soon"
      - position:
          lat: 51.4975
          lng: -0.1357
        label: "3"
        title: "Order #1044 - Picked up"
      - position:
          lat: 51.5155
          lng: -0.1419
        label: "4"
        title: "Order #1045 - En route"
  events:
    onMarkerClick:
      - id: gm_delivery_marker_action
        type: DisplayMessage
        params:
          content: Opening delivery details...
          duration: 2
- id: gm_delivery_legend
  type: Box
  layout:
    gap: 16
  blocks:
    - id: gm_delivery_tag1
      type: Tag
      properties:
        title: En route
        color: blue
    - id: gm_delivery_tag2
      type: Tag
      properties:
        title: Arriving soon
        color: green
    - id: gm_delivery_tag3
      type: Tag
      properties:
        title: Picked up
        color: orange
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoBounds` | boolean | `true` | Automatically fit the map bounds to include all markers, clusterers, and info windows. |
| `map` | object | - | Map settings object. |
| `map.center` | object | - | A coordinate position object by which to center the map. |
| `map.center.lat` | number | - | Lateral coordinate. |
| `map.center.lng` | number | - | Longitudinal coordinate. |
| `map.zoom` | number | - | Map zoom level. |
| `map.options` | object | - | Map options. See [Google Maps MapOptions](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions). |
| `heatmap` | object | - | Add a heatmap layer. This will automatically load the visualization library. See [heatmap options](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions). |
| `heatmap.data` | array | - | A list of heatmap data points. |
| `heatmap.data.$.lat` | number | - | Lateral coordinate. |
| `heatmap.data.$.lng` | number | - | Longitudinal coordinate. |
| `heatmap.data.$.weight` | number | - | Item weight on heatmap. |
| `markers` | array | - | A list of markers with marker options. See [Google Maps Markers](https://developers.google.com/maps/documentation/javascript/markers). |
| `markers.$.position` | object | - |  |
| `markers.$.position.lat` | number | - | Lateral coordinate. |
| `markers.$.position.lng` | number | - | Longitudinal coordinate. |
| `markers.$.label` | string | - | Label displayed on marker. |
| `markers.$.title` | string | - | Marker title shown on hover. |
| `markerClusterers` | array | - | A list of marker clusterers with marker clusterer options. |
| `markerClusterers.$.markers` | array | - | A list of markers with marker options. |
| `markerClusterers.$.markers.$.position` | object | - |  |
| `markerClusterers.$.markers.$.position.lat` | number | - | Lateral coordinate. |
| `markerClusterers.$.markers.$.position.lng` | number | - | Longitudinal coordinate. |
| `markerClusterers.$.markers.$.label` | string | - | Label displayed on marker. |
| `markerClusterers.$.options` | object | - | Marker clusterer options. See [MarkerClusterer](https://react-google-maps-api-docs.netlify.app/#markerclusterer). |
| `markerClusterers.$.options.averageCenter` | boolean | - | Whether the position of a cluster marker should be the average position of all markers in the cluster. |
| `markerClusterers.$.options.gridSize` | number | - | The grid size of a cluster in pixels. |
| `markerClusterers.$.options.maxZoom` | number | - | The maximum zoom level at which clustering is enabled. |
| `markerClusterers.$.options.minimumClusterSize` | number | - | The minimum number of markers needed to form a cluster. |
| `markerClusterers.$.options.styles` | array | - | Styles of the cluster markers to be used. |
| `markerClusterers.$.options.zoomOnClick` | boolean | - | Whether to zoom the map when a cluster marker is clicked. |
| `infoWindow` | object | - | Info window options. See [InfoWindowOptions](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions). |
| `infoWindow.visible` | boolean | - | When visible is true, blocks inside the infoWindow content area will be rendered. |
| `infoWindow.position` | object | - |  |
| `infoWindow.position.lat` | number | - | Lateral coordinate. |
| `infoWindow.position.lng` | number | - | Longitudinal coordinate. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onBoundsChanged` | \- | Trigger actions when the bounds of the map are changed. |
| `onCenterChanged` | \- | Trigger actions when the center of the map is changed. |
| `onClick` | \- | Trigger actions when the map is clicked. |
| `onClusterClick` | \- | Trigger actions when a marker cluster is clicked. |
| `onMarkerClick` | \- | Trigger actions when a marker is clicked. |
| `onZoomChanged` | \- | Trigger actions when the zoom on the map is changed. |
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
