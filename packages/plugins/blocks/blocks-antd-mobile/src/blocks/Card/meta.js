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
  slots: {
    content: 'Content area of the card.',
  },
  cssKeys: {
    element: 'The Card element.',
    header: 'The Card header.',
    body: 'The Card body.',
  },
  events: {
    onClick: 'Trigger actions when the card is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      extra: {
        type: 'string',
        description: 'Extra content in the top-right of the card header - supports html.',
      },
      title: {
        type: 'string',
        description: 'Card title - supports html.',
      },
    },
  },
};
