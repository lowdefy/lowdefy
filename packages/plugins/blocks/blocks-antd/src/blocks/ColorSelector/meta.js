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

import LabelMeta from '../Label/meta.js';
import label from '../../schemas/label.js';
import { allowClear, inputTitle } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'string',
  cssKeys: {
    element: 'The ColorSelector element.',
    label: 'The ColorSelector label.',
    extra: 'The ColorSelector extra content.',
    feedback: 'The ColorSelector validation feedback.',
    popup: 'The ColorSelector popup.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when the color is changed.',
      event: {
        value:
          'The selected color as a hex string, a linear-gradient CSS string in gradient mode, or null when cleared.',
      },
    },
    onChangeComplete: {
      description: 'Trigger actions when the color change is complete.',
      event: {
        value:
          'The final color as a hex string, a linear-gradient CSS string in gradient mode, or null when cleared.',
      },
    },
    onClear: 'Trigger actions when the color is cleared.',
    onFormatChange: {
      description: 'Trigger actions when the color format is changed.',
      event: { format: 'The new color format.' },
    },
    onOpenChange: {
      description: 'Trigger actions when the color picker popup open state changes.',
      event: { open: 'Whether the popup is open.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
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
      label,
      title: inputTitle,
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the color picker.',
      },
      allowClear: { ...allowClear, default: false },
      arrow: {
        type: 'boolean',
        default: true,
        description: 'Show arrow on the color picker popup.',
      },
      disabledAlpha: {
        type: 'boolean',
        default: false,
        description: 'Disable the alpha channel slider.',
      },
      disabledFormat: {
        type: 'boolean',
        default: false,
        description: 'Disable the format selector.',
      },
      mode: {
        oneOf: [
          {
            type: 'string',
            enum: ['single', 'gradient'],
            default: 'single',
            description: 'Pick a single color or a gradient.',
          },
          {
            type: 'array',
            description: 'Offer both modes with a switch in the panel, eg. [single, gradient].',
            items: {
              type: 'string',
              enum: ['single', 'gradient'],
            },
          },
        ],
        description:
          'Pick a single color, a gradient, or both with a switch in the panel when set to [single, gradient]. A gradient is stored as a linear-gradient CSS string, eg. "linear-gradient(90deg, rgb(22,119,255) 0%, rgb(114,46,209) 100%)", which can be used directly as a CSS background.',
      },
      open: {
        type: 'boolean',
        description: 'Controlled open state of the color picker popup.',
      },
      placement: {
        type: 'string',
        enum: [
          'top',
          'topLeft',
          'topRight',
          'bottom',
          'bottomLeft',
          'bottomRight',
          'left',
          'leftTop',
          'leftBottom',
          'right',
          'rightTop',
          'rightBottom',
        ],
        description: 'Placement of the color picker popup.',
      },
      presets: {
        type: 'array',
        description: 'Preset color palettes.',
        docs: {
          displayType: 'yaml',
        },
        items: {
          type: 'object',
          required: ['label', 'colors'],
          properties: {
            label: {
              type: 'string',
              description: 'Title of the palette.',
            },
            colors: {
              type: 'array',
              description: 'Colors in the palette.',
              items: {
                type: 'string',
                description: 'A CSS color, eg. "#1677ff" or "rgb(22, 119, 255)".',
              },
            },
            defaultOpen: {
              type: 'boolean',
              default: true,
              description: 'Whether the palette is expanded when the popup opens.',
            },
          },
        },
      },
      trigger: {
        type: 'string',
        enum: ['hover', 'click'],
        default: 'click',
        description: 'Trigger mode for the color picker popup.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/color-picker#design-token',
        },
        properties: {
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the color picker trigger.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color used in the color picker panel.',
          },
          colorText: {
            type: 'string',
            description: 'Text color in the color picker panel.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color for the elevated popup panel.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for text in the color picker.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the color picker trigger.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of the color picker trigger for large size.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height of the color picker trigger for small size.',
          },
        },
      },
    },
  },
};
