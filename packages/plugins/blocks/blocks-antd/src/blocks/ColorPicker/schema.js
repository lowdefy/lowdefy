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
      defaultValue: {
        type: 'string',
        description: 'Default color value.',
      },
      format: {
        type: 'string',
        enum: ['rgb', 'hex', 'hsb'],
        description: 'Color format.',
      },
      showText: {
        type: 'boolean',
        description: 'Show color text.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        description: 'Size of the color picker.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the color picker.',
      },
      allowClear: {
        type: 'boolean',
        default: false,
        description: 'Allow clearing the color.',
      },
      presets: {
        type: 'array',
        description: 'Preset color palettes.',
      },
      trigger: {
        type: 'string',
        enum: ['hover', 'click'],
        default: 'click',
        description: 'Trigger mode for the color picker popup.',
      },
    },
  },
};
