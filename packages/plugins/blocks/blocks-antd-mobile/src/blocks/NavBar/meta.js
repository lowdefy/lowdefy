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
    element: 'The NavBar element.',
  },
  events: {
    onBack: 'Trigger actions when the back area is clicked, e.g. a Link action.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      back: {
        type: 'boolean',
        description: 'Show the back arrow. Set to false to hide the back area.',
        default: true,
      },
      backText: {
        type: 'string',
        description: 'Text next to the back arrow.',
      },
      left: {
        type: 'string',
        description: 'Content on the left, after the back area - supports html.',
      },
      right: {
        type: 'string',
        description: 'Content on the right - supports html.',
      },
      title: {
        type: 'string',
        description: 'NavBar title - supports html.',
      },
    },
  },
};
