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

const coordinate = {
  type: 'object',
  required: ['latitude', 'longitude'],
  properties: {
    latitude: { type: 'number' },
    longitude: { type: 'number' },
  },
};

// Map has no web block of its name (blocks-google-maps draws GoogleMaps on the web): a page that
// uses it is mobile only. Apple Maps on iOS and Google Maps on Android (expo-maps), in shells that
// carry maps (profile field).
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The map.',
  },
  events: {
    onMarkerClick: {
      description: 'Trigger actions when a marker is tapped.',
      event: { marker: 'The marker, as given in markers.' },
    },
    onMapClick: {
      description: 'Trigger actions when the map is tapped away from a marker.',
      event: { latitude: 'The latitude tapped.', longitude: 'The longitude tapped.' },
    },
    onRegionChange: {
      description: 'Trigger actions when the person moves or zooms the map.',
      event: { center: '{ latitude, longitude }', zoom: 'The zoom level.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      center: { ...coordinate, description: 'Where the map opens. The first marker by default.' },
      height: { type: 'number', default: 300, description: 'The height of the map.' },
      mapType: {
        type: 'string',
        enum: ['standard', 'satellite', 'hybrid'],
        default: 'standard',
        description: 'The map style.',
      },
      markers: {
        type: 'array',
        description: 'Markers on the map.',
        items: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            id: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
          },
        },
      },
      polylines: {
        type: 'array',
        description: 'Lines on the map, like a route.',
        items: {
          type: 'object',
          required: ['coordinates'],
          properties: {
            id: { type: 'string' },
            coordinates: { type: 'array', items: coordinate },
            color: { type: 'string' },
            width: { type: 'number' },
          },
        },
      },
      showsUserLocation: {
        type: 'boolean',
        default: false,
        description: "Show the person's location (asks for location permission).",
      },
      zoom: { type: 'number', default: 12, description: 'The zoom level, 1 (world) to 20.' },
    },
  },
};
