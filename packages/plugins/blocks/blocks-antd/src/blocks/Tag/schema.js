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
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      closable: {
        type: 'boolean',
        default: false,
        description: 'Allow tag to be closed.',
      },
      color: {
        type: 'string',
        description:
          'Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color.',
        docs: {
          displayType: 'color',
        },
      },
      title: {
        type: 'string',
        description: 'Content title of tag - supports html.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          'Name of an Ant Design Icon or properties of an Icon block to customize alert icon.',
        docs: {
          displayType: 'icon',
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Called when Tag is clicked.',
      },
      onClose: {
        type: 'array',
        description: 'Called when Tag close icon is clicked.',
      },
    },
  },
};
