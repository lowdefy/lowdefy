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
  cssKeys: {
    element: 'The Watermark element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      font: {
        type: 'object',
        description:
          'Font style configuration with color, fontSize, fontWeight, fontFamily, fontStyle, textAlign.',
        properties: {
          color: {
            type: 'string',
            description: 'Font color of the watermark.',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family of the watermark.',
          },
          fontSize: {
            type: 'number',
            description: 'Font size of the watermark.',
          },
          fontStyle: {
            type: 'string',
            description: 'Font style of the watermark.',
          },
          fontWeight: {
            type: ['string', 'number'],
            description: 'Font weight of the watermark.',
            docs: {
              displayType: 'yaml',
            },
          },
          textAlign: {
            type: 'string',
            enum: ['start', 'end', 'left', 'right', 'center'],
            description: 'Text alignment of the watermark.',
          },
        },
      },
      gap: {
        type: 'array',
        description: 'Gap between watermarks as [horizontal, vertical].',
        docs: {
          displayType: 'yaml',
        },
      },
      height: {
        type: 'number',
        description: 'Height of the watermark.',
      },
      image: {
        type: 'string',
        description: 'Image URL to use as watermark. If set, text content is ignored.',
      },
      inherit: {
        type: 'boolean',
        default: true,
        description: 'Inherit watermark config from parent Watermark block.',
      },
      offset: {
        type: 'array',
        description: 'Offset of the watermark from the top-left as [x, y].',
        docs: {
          displayType: 'yaml',
        },
      },
      rotate: {
        type: 'number',
        default: -22,
        description: 'Rotation angle of watermark in degrees.',
      },
      text: {
        type: ['string', 'array'],
        description: 'Watermark text content. Maps to antd "content" prop.',
        docs: {
          displayType: 'yaml',
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/watermark#design-token',
        },
        properties: {
          colorFill: {
            type: 'string',
            description:
              'Default watermark text color when font.color is not set. Maps to the global colorFill token.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description:
              'Default watermark font size when font.fontSize is not set. Maps to the global fontSizeLG token.',
          },
          fontFamily: {
            type: 'string',
            default: 'sans-serif',
            description: 'Default font family used when font.fontFamily is not set.',
          },
        },
      },
      width: {
        type: 'number',
        description: 'Width of the watermark.',
      },
      zIndex: {
        type: 'integer',
        description: 'Z-index of the watermark.',
      },
    },
  },
};
