/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: ['content', 'infoWindow'],
  cssKeys: {
    element: 'The map container element.',
  },
  events: {
    onBoundsChanged: 'Trigger actions when the bounds of the map are changed.',
    onCenterChanged: 'Trigger actions when the center of the map is changed.',
    onClick: 'Trigger actions when the map is clicked.',
    onClusterClick: 'Trigger actions when a marker cluster is clicked.',
    onMarkerClick: 'Trigger actions when a marker is clicked.',
    onZoomChanged: 'Trigger actions when the zoom on the map is changed.',
    onInfoWindowCloseClick: 'Trigger actions when the info window close button is clicked.',
    onInfoWindowPositionChanged: 'Trigger actions when the info window position changes.',
    onLoad: 'Trigger actions when the map is loaded.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoBounds: {
        type: 'boolean',
        default: true,
        description:
          'Automatically fit the map bounds to include all markers, clusterers, and info windows.',
      },
      map: {
        type: 'object',
        description: 'Map settings object.',
        properties: {
          center: {
            type: 'object',
            description: 'A coordinate position object by which to center the map.',
            properties: {
              lat: {
                type: 'number',
                description: 'Lateral coordinate.',
              },
              lng: {
                type: 'number',
                description: 'Longitudinal coordinate.',
              },
            },
          },
          zoom: {
            type: 'number',
            description: 'Map zoom level.',
          },
          options: {
            type: 'object',
            description:
              'Map options. See <a href="https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions">Google Maps MapOptions</a>.',
          },
        },
      },
      heatmap: {
        type: 'object',
        description:
          'Add a heatmap layer. This will automatically load the visualization library. See <a href="https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions">heatmap options</a>.',
        properties: {
          data: {
            type: 'array',
            description: 'A list of heatmap data points.',
            items: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Lateral coordinate.',
                },
                lng: {
                  type: 'number',
                  description: 'Longitudinal coordinate.',
                },
                weight: {
                  type: 'number',
                  description: 'Item weight on heatmap.',
                },
              },
            },
          },
        },
      },
      markers: {
        type: 'array',
        description:
          'A list of markers with marker options. See <a href="https://developers.google.com/maps/documentation/javascript/markers">Google Maps Markers</a>.',
        items: {
          type: 'object',
          properties: {
            position: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Lateral coordinate.',
                },
                lng: {
                  type: 'number',
                  description: 'Longitudinal coordinate.',
                },
              },
            },
            label: {
              type: 'string',
              description: 'Label displayed on marker.',
            },
            title: {
              type: 'string',
              description: 'Marker title shown on hover.',
            },
          },
        },
      },
      markerClusterers: {
        type: 'array',
        description: 'A list of marker clusterers with marker clusterer options.',
        items: {
          type: 'object',
          properties: {
            markers: {
              type: 'array',
              description: 'A list of markers with marker options.',
              items: {
                type: 'object',
                properties: {
                  position: {
                    type: 'object',
                    properties: {
                      lat: {
                        type: 'number',
                        description: 'Lateral coordinate.',
                      },
                      lng: {
                        type: 'number',
                        description: 'Longitudinal coordinate.',
                      },
                    },
                  },
                  label: {
                    type: 'string',
                    description: 'Label displayed on marker.',
                  },
                },
              },
            },
            options: {
              type: 'object',
              description:
                'Marker clusterer options. See <a href="https://react-google-maps-api-docs.netlify.app/#markerclusterer">MarkerClusterer</a>.',
              properties: {
                averageCenter: {
                  type: 'boolean',
                  description:
                    'Whether the position of a cluster marker should be the average position of all markers in the cluster.',
                },
                gridSize: {
                  type: 'number',
                  description: 'The grid size of a cluster in pixels.',
                },
                maxZoom: {
                  type: 'number',
                  description: 'The maximum zoom level at which clustering is enabled.',
                },
                minimumClusterSize: {
                  type: 'number',
                  description: 'The minimum number of markers needed to form a cluster.',
                },
                styles: {
                  type: 'array',
                  description: 'Styles of the cluster markers to be used.',
                },
                zoomOnClick: {
                  type: 'boolean',
                  description: 'Whether to zoom the map when a cluster marker is clicked.',
                },
              },
            },
          },
        },
      },
      infoWindow: {
        type: 'object',
        description:
          'Info window options. See <a href="https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions">InfoWindowOptions</a>.',
        properties: {
          visible: {
            type: 'boolean',
            description:
              'When visible is true, blocks inside the infoWindow content area will be rendered.',
          },
          position: {
            type: 'object',
            properties: {
              lat: {
                type: 'number',
                description: 'Lateral coordinate.',
              },
              lng: {
                type: 'number',
                description: 'Longitudinal coordinate.',
              },
            },
          },
        },
      },
      style: {
        type: 'object',
        description: 'Custom CSS properties to apply to the map container.',
      },
    },
  },
};
