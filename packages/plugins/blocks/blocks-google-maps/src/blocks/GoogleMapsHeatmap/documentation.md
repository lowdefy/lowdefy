<TITLE>
GoogleMapsHeatmap
</TITLE>

<DESCRIPTION>

This is a Lowdefy block which implements [Heatmap](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions) from the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).

In order to use this block, it must be wrapped in a [`GoogleMapsScript`](./GoogleMapsScript) block with the visualization library specified.

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

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "map": {
        "type": "object",
        "description": "Map settings object.",
        "properties": {
          "center": {
            "type": "object",
            "description": "A coordinate position object by which to center the map.",
            "properties": {
              "lat": {
                "type": "number",
                "description": "Lateral coordinate."
              },
              "lng": {
                "type": "number",
                "description": "Longitudinal coordinate."
              }
            }
          },
          "zoom": {
            "type": "number",
            "description": "Map zoom level."
          },
          "options": {
            "type": "object",
            "description": "Map options, see <a href='https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions'>more</a>."
          }
        }
      },
      "heatmap": {
        "type": "object",
        "description": "Add a heatmap layer, see more <a href='https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions'>heatmap options</a>. This will automatically load the 'visualization' library.",
        "properties": {
          "data": {
            "type": "array",
            "description": "A list of heatmap data points.",
            "items": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number",
                  "description": "Lateral coordinate."
                },
                "lng": {
                  "type": "number",
                  "description": "Longitudinal coordinate."
                },
                "weight": {
                  "type": "number",
                  "description": "Item weight on heatmap."
                }
              }
            }
          }
        }
      },
      "markers": {
        "type": "array",
        "description": "A list of Markers with marker options.",
        "items": {
          "type": "object",
          "properties": {
            "position": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number",
                  "description": "Lateral coordinate."
                },
                "lng": {
                  "type": "number",
                  "description": "Longitudinal coordinate."
                }
              }
            },
            "label": {
              "type": "string",
              "description": "Label displayed on marker."
            }
          }
        }
      },
      "infoWindow": {
        "type": "object",
        "description": "infoWindow options, see <a href='https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions'>more</a>.",
        "properties": {
          "visible": {
            "type": "boolean",
            "description": "When visible is true, blocks inside infoWindow content area will be rendered."
          },
          "position": {
            "type": "object",
            "properties": {
              "lat": {
                "type": "number",
                "description": "Lateral coordinate."
              },
              "lng": {
                "type": "number",
                "description": "Longitudinal coordinate."
              }
            }
          }
        }
      },
      "style": {
        "type": "object",
        "description": "Custom map css properties to apply to map block."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger actions when the map is clicked."
      },
      "onMarkerClick": {
        "type": "array",
        "description": "Trigger actions when marker is clicked."
      },
      "onZoomChanged": {
        "type": "array",
        "description": "Trigger actions when the zoom on the map is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Add a heatmap

```yaml
id: google_maps_script
type: GoogleMapsScript
properties:
  apiKey:
    _build.env: GOOGLE_MAPS_API_KEY
  libraries:
    - visualization
blocks:
  - id: google_maps
    type: GoogleMapsHeatmap
    properties:
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
          opacity: 1
          radius: 20
      map:
        disableDefaultUI: true
```

</EXAMPLES>
