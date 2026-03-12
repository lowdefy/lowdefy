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

const schema = {
  type: 'object',
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
        type: 'string',
        enum: ['single', 'gradient'],
        default: 'single',
        description: 'Color picker mode.',
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
          colorPickerWidth: {
            type: 'number',
            default: 234,
            description: 'Width of the color picker panel.',
          },
          colorPickerHandlerSize: {
            type: 'number',
            default: 16,
            description: 'Size of the color picker handler (drag handle).',
          },
          colorPickerHandlerSizeSM: {
            type: 'number',
            default: 12,
            description: 'Size of the color picker handler for small size.',
          },
          colorPickerSliderHeight: {
            type: 'number',
            default: 8,
            description: 'Height of the color slider bar.',
          },
          colorPickerPreviewSize: {
            type: 'number',
            description:
              'Size of the color preview circle. Defaults to a calculated value based on slider height.',
          },
          colorPickerAlphaInputWidth: {
            type: 'number',
            default: 44,
            description: 'Width of the alpha input field.',
          },
          colorPickerInputNumberHandleWidth: {
            type: 'number',
            default: 16,
            description: 'Width of the input number handle in the color picker.',
          },
          colorPickerPresetColorSize: {
            type: 'number',
            default: 24,
            description: 'Size of preset color swatches.',
          },
          colorPickerInsetShadow: {
            type: 'string',
            description: 'Inset shadow style for the color picker.',
          },
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
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onChange: {
        type: 'array',
        description: 'Trigger actions when the color is changed.',
      },
      onChangeComplete: {
        type: 'array',
        description: 'Trigger actions when the color change is complete.',
      },
      onClear: {
        type: 'array',
        description: 'Trigger actions when the color is cleared.',
      },
      onFormatChange: {
        type: 'array',
        description: 'Trigger actions when the color format is changed.',
      },
      onOpenChange: {
        type: 'array',
        description: 'Trigger actions when the color picker popup open state changes.',
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default schema;
