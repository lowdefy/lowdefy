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
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    required: ['src'],
    properties: {
      src: {
        type: 'string',
        description: 'The image URL.',
      },
      alt: {
        type: 'string',
        description: 'Alternative text description of the image.',
      },
      crossOrigin: {
        type: 'string',
        enum: ['anonymous', 'use-credentials'],
        description: 'Indicates if the fetching of the image must be done using a CORS request.',
      },
      decoding: {
        type: 'string',
        enum: ['sync', 'async', 'auto'],
        description:
          'An image decoding hint to the browser. Sync for atomic presentation with other content, async,  to reduce delay in presenting other content and auto leave to browser to decide.',
      },
      height: {
        type: 'number',
        description: 'Height of the image.',
      },
      loading: {
        type: 'string',
        enum: ['eager', 'lazy'],
        description:
          'How the browser should load the image. Eager loads the image immediately, lazy, defers loading until the image it reaches a calculated distance from the viewport, as defined by the browser.',
      },
      sizes: {
        type: 'string',
        description: 'Indicating a set of source sizes of strings separated by commas.',
      },
      srcSet: {
        type: 'string',
        description:
          'Possible image sources for the user agent to use, strings separated by commas.',
        docs: {
          displayType: 'text-area',
        },
      },
      style: {
        type: 'object',
        description: 'Css style object to applied to the image.',
        docs: {
          displayType: 'yaml',
        },
      },
      width: {
        type: 'number',
        description: 'Width of the image.',
      },
    },
  },
};
