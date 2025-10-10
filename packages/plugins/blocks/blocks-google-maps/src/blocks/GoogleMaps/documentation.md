<TITLE>
GoogleMaps
</TITLE>

<DESCRIPTION>

This is a Lowdefy block which implements the following from the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview):
  - [Map](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)
  - [Markers](https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions)
  - [Marker Clusterers](https://developers.google.com/maps/documentation/javascript/marker-clustering)

In order to use this block, it must be wrapped in a [`GoogleMapsScript`](./GoogleMapsScript) block.

### Properties

- `apiKey: string`: Your Google Maps API key.
- `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).
- `map: mapOptions`: All [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
  - `center: { lat: number, lng: number }`: A coordinate position object by which to center the map.
  - `zoom: number`: Map zoom level.
  - `options: mapOptions`: All other [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
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
      "markerClusterers": {
        "type": "array",
        "description": "A list of Marker Clusterers with marker clusterer options.",
        "items": {
          "type": "object",
          "properties": {
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
            "options": {
              "type": "object",
              "properties": {
                "averageCenter": {
                  "type": "boolean",
                  "description": "Whether the position of a cluster marker should be the average position of all markers in the cluster."
                },
                "gridSize": {
                  "type": "number",
                  "description": "The grid size of a cluster in pixels."
                },
                "maxZoom": {
                  "type": "number",
                  "description": "The maximum zoom level at which clustering is enabled."
                },
                "minimumClusterSize": {
                  "type": "number",
                  "description": "The minimum number of markers needed to form a cluster."
                },
                "styles": {
                  "type": "array",
                  "description": "Styles of the cluster markers to be used."
                },
                "zoomOnClick": {
                  "type": "boolean",
                  "description": "Whether to zoom the map when a cluster marker is clicked."
                }
              }
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
      "onBoundsChanged": {
        "type": "array",
        "description": "Trigger actions when the bounds of the map are changed."
      },
      "onCenterChanged": {
        "type": "array",
        "description": "Trigger actions when the center of the map is changed."
      },
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

### Add markers

```yaml
id: google_maps_script
type: GoogleMapsScript
properties:
  apiKey:
    _build.env: GOOGLE_MAPS_API_KEY
blocks:
  - id: google_maps
    type: GoogleMaps
    properties:
      map:
        center:
          lat: -25.344
          lng: 131.036
        options:
          fullscreenControl: true
          panControl: true
          zoomControl: true
        zoom: 14
      markers:
        - label: One
          position:
            lat: -25.344
            lng: 131.036
        - label: Two
          position:
            lat: -25.348
            lng: 131.038
```

### Add markers with onClick event

```yaml
id: google_maps_script
type: GoogleMapsScript
properties:
  apiKey:
    _build.env: GOOGLE_MAPS_API_KEY
blocks:
  - id: google_maps
    type: GoogleMaps
    properties:
      map:
        center:
          lat: -25.344
          lng: 131.036
        options:
          fullscreenControl: true
          panControl: true
          zoomControl: true
        zoom: 5
      markers:
        _state: markers_list
    events:
      onClick:
        - id: markers_list
          params:
            markers_list:
              _array.concat:
                - - label: Hi
                    position:
                      _event: latLng
                - _if_none:
                  - _state: markers_list
                  - []
          type: SetState
```

</EXAMPLES>
