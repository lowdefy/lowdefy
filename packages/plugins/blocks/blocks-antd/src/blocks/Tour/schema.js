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
      open: {
        type: 'boolean',
        default: false,
        description: 'Whether to show the tour.',
      },
      steps: {
        type: 'array',
        description:
          'Tour steps. Each step has title, description, target (blockId string), placement, etc.',
      },
      current: {
        type: 'integer',
        description: 'Current step index.',
      },
      type: {
        type: 'string',
        enum: ['default', 'primary'],
        default: 'default',
        description: 'Type of the tour.',
      },
      placement: {
        type: 'string',
        description: 'Position of the guide card relative to the target element.',
      },
      mask: {
        type: ['boolean', 'object'],
        default: true,
        description: 'Whether to enable mask.',
      },
      arrow: {
        type: ['boolean', 'object'],
        default: true,
        description: 'Whether to show the arrow.',
      },
    },
  },
};
