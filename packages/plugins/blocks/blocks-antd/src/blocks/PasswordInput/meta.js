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
import {
  disabled,
  placeholder,
  inputTitle,
  autoFocus,
  variant,
  bordered,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'string',
  cssKeys: {
    element: 'The PasswordInput element.',
    label: 'The PasswordInput label.',
    extra: 'The PasswordInput extra content.',
    feedback: 'The PasswordInput validation feedback.',
  },
  events: {
    onBlur: 'Trigger action event occurs when text input loses focus.',
    onChange: {
      description: 'Trigger action when text input is changed.',
      event: { value: 'The current input value.' },
    },
    onFocus: 'Trigger action when text input gets focus.',
    onPressEnter: 'Trigger action when enter is pressed while text input is focused.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus,
      bordered,
      disabled,
      placeholder,
      label,
      size: sizeSmallDefaultLarge,
      title: inputTitle,
      variant,
      visibilityToggle: {
        type: 'boolean',
        default: true,
        description: 'Show password visibility toggle button.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/input#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Border color when the input is active (focused).',
          },
          activeShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(5, 145, 255, 0.1)',
            description: 'Shadow effect when the input is active (focused).',
          },
          addonBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color for input addon elements.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large inputs.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small inputs.',
          },
          colorBgContainer: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the input.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the input.',
          },
          colorText: {
            type: 'string',
            description: 'Text color inside the input.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Placeholder text color.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text color when the input is disabled.',
          },
          colorBgContainerDisabled: {
            type: 'string',
            description: 'Background color when the input is disabled.',
          },
          errorActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 38, 5, 0.06)',
            description: 'Shadow effect for error state when the input is active.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the input text.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large inputs.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for small inputs.',
          },
          hoverBorderColor: {
            type: 'string',
            default: '#4096ff',
            description: 'Border color when hovering over the input.',
          },
          hoverBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color when hovering over the input.',
          },
          activeBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color when the input is active (focused).',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding of the input.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for large inputs.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for small inputs.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding of the input.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for large inputs.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small inputs.',
          },
          warningActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 215, 5, 0.1)',
            description: 'Shadow effect for warning state when the input is active.',
          },
        },
      },
    },
  },
};
