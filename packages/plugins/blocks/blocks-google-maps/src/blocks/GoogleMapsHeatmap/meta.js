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
    onClick: 'Trigger actions when the map is clicked.',
    onMarkerClick: 'Trigger actions when a marker is clicked.',
    onZoomChanged: 'Trigger actions when the zoom on the map is changed.',
    onBoundsChanged: 'Trigger actions when the bounds of the map are changed.',
    onCenterChanged: 'Trigger actions when the center of the map is changed.',
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
          'Automatically fit the map bounds to include all markers and heatmap data points.',
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
          'Heatmap layer options. See <a href="https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions">heatmap options</a>.',
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
          radius: {
            type: 'number',
            description: 'The radius of influence for each data point, in pixels.',
          },
          opacity: {
            type: 'number',
            description: 'The opacity of the heatmap, from 0 to 1.',
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
