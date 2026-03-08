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
      text: {
        type: ['string', 'array'],
        description: 'Watermark text content. Maps to antd "content" prop.',
      },
      font: {
        type: 'object',
        description:
          'Font style configuration with color, fontSize, fontWeight, fontFamily, fontStyle.',
      },
      gap: {
        type: 'array',
        description: 'Gap between watermarks as [horizontal, vertical].',
      },
      offset: {
        type: 'array',
        description: 'Offset of the watermark from the top-left as [x, y].',
      },
      rotate: {
        type: 'number',
        default: -22,
        description: 'Rotation angle of watermark in degrees.',
      },
      zIndex: {
        type: 'integer',
        description: 'Z-index of the watermark.',
      },
      width: {
        type: 'number',
        description: 'Width of the watermark.',
      },
      height: {
        type: 'number',
        description: 'Height of the watermark.',
      },
    },
  },
};
