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
  slots: ['content'],
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      apiKey: {
        type: 'string',
        description: 'Your Google Maps API key.',
      },
      libraries: {
        type: 'array',
        description:
          'A list of Google libraries to load. See <a href="https://developers.google.com/maps/documentation/javascript/libraries">Google Maps Libraries</a>.',
        items: {
          type: 'string',
          enum: [
            'drawing',
            'geometry',
            'journeySharing',
            'localContext',
            'places',
            'visualization',
          ],
        },
      },
      language: {
        type: 'string',
        description: 'The language code for the Google Maps API (e.g. "en", "fr", "ja").',
      },
      region: {
        type: 'string',
        description:
          'The region code to bias geocoding results (e.g. "US", "GB"). See <a href="https://developers.google.com/maps/documentation/javascript/localization">localization</a>.',
      },
      version: {
        type: 'string',
        description:
          'The version of the Google Maps JavaScript API to load (e.g. "weekly", "3.50").',
      },
      channel: {
        type: 'string',
        description: 'A channel parameter for tracking API usage.',
      },
    },
  },
};
