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
    properties: {
      vertical: {
        type: 'boolean',
        default: false,
        description: 'Whether the main axis direction is vertical.',
      },
      wrap: {
        type: ['boolean', 'string'],
        description: 'Set whether the element is displayed in a single line or in multiple lines.',
      },
      justify: {
        type: 'string',
        enum: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        description: 'Set the alignment of elements on the main axis.',
      },
      align: {
        type: 'string',
        enum: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
        description: 'Set the alignment of elements on the cross axis.',
      },
      gap: {
        type: ['string', 'number'],
        description: 'Set the gap between items. Can be "small", "middle", "large", or a number.',
      },
      flex: {
        type: ['string', 'number'],
        description: 'Flex CSS shorthand property.',
      },
      component: {
        type: 'string',
        description: 'Custom element type.',
      },
    },
  },
};
