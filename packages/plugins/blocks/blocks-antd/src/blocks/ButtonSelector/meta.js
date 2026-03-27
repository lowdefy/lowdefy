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
import options from '../../schemas/options.js';
import { disabled, inputTitle, sizeSmallDefaultLarge } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'any',
  cssKeys: {
    element: 'The ButtonSelector element.',
    label: 'The ButtonSelector label.',
    extra: 'The ButtonSelector extra content.',
    feedback: 'The ButtonSelector validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when selection is changed.',
      event: { value: 'The selected value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      buttonStyle: {
        type: 'string',
        enum: ['solid', 'outline'],
        default: 'solid',
        description: 'Style of the selected option button.',
      },
      color: {
        type: 'string',
        description: 'Selected button color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled,
      options,
      size: sizeSmallDefaultLarge,
      label,
      title: inputTitle,
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/radio#design-token',
        },
        properties: {
          radioSize: {
            type: 'number',
            default: 16,
            description: 'Size of the radio dot element.',
          },
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Size of the inner dot when checked.',
          },
          dotColorDisabled: {
            type: 'string',
            description: 'Color of the inner dot when disabled.',
          },
          buttonSolidCheckedColor: {
            type: 'string',
            description: 'Text color of checked button in solid style.',
          },
          buttonSolidCheckedBg: {
            type: 'string',
            description: 'Background color of checked button in solid style.',
          },
          buttonSolidCheckedHoverBg: {
            type: 'string',
            description: 'Background color of checked button on hover in solid style.',
          },
          buttonSolidCheckedActiveBg: {
            type: 'string',
            description: 'Background color of checked button on active in solid style.',
          },
          buttonBg: {
            type: 'string',
            description: 'Background color of unchecked radio buttons.',
          },
          buttonCheckedBg: {
            type: 'string',
            description: 'Background color of checked button in outline style.',
          },
          buttonColor: {
            type: 'string',
            description: 'Text color of radio buttons.',
          },
          buttonCheckedBgDisabled: {
            type: 'string',
            description: 'Background color of checked button when disabled.',
          },
          buttonCheckedColorDisabled: {
            type: 'string',
            description: 'Text color of checked button when disabled.',
          },
          buttonPaddingInline: {
            type: 'number',
            default: 15,
            description: 'Horizontal padding inside radio buttons.',
          },
          wrapperMarginInlineEnd: {
            type: 'number',
            default: 8,
            description: 'Margin at the inline end of each radio wrapper.',
          },
          radioColor: {
            type: 'string',
            description: 'Color of the radio dot when checked.',
          },
          radioBgColor: {
            type: 'string',
            description: 'Background color of the radio circle when checked.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius for default-sized radio buttons.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large radio buttons.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small radio buttons.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of default-sized radio buttons.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of large radio buttons.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height of small radio buttons.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for default-sized radio buttons.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large radio buttons.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of radio buttons.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color used for checked state border and text.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary hover color for checked radio buttons.',
          },
          colorPrimaryActive: {
            type: 'string',
            description: 'Primary active color for checked radio buttons.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color for the radio button container.',
          },
          colorText: {
            type: 'string',
            description: 'Default text color for radio buttons.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color for radio buttons.',
          },
        },
      },
    },
  },
};
