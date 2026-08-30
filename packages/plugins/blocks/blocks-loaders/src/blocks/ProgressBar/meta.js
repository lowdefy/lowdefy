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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The ProgressBar element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      progress: {
        type: 'number',
        default: 30,
        description: 'Progress percentage to show, from 0 to 100.',
      },
      shadow: {
        type: 'boolean',
        default: true,
        description: 'Render the glowing shadow at the head of the bar.',
      },
      transitionTime: {
        type: 'number',
        default: 1000,
        description: 'Width transition duration in milliseconds.',
      },
      height: {
        type: ['number', 'string'],
        description: 'Height of the skeleton.',
      },
      width: {
        type: ['number', 'string'],
        description: 'Width of the skeleton.',
      },
    },
  },
};
