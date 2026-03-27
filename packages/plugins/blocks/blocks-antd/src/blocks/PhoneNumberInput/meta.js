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
import icon from '../../schemas/icon.js';
import {
  disabled,
  placeholder,
  inputTitle,
  autoFocus,
  variant,
  bordered,
  allowClear,
  sizeSmallMiddleLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'object',
  cssKeys: {
    element: 'The PhoneNumberInput element.',
    label: 'The PhoneNumberInput label.',
    extra: 'The PhoneNumberInput extra content.',
    feedback: 'The PhoneNumberInput validation feedback.',
    options: 'The PhoneNumberInput options.',
    prefixIcon: 'The prefix icon in the PhoneNumberInput.',
    select: 'The PhoneNumberInput select.',
    suffixIcon: 'The suffix icon in the PhoneNumberInput.',
  },
  events: {
    onInputChange: 'Trigger action when text input is changed.',
    onCodeChange: 'Trigger action when the selector is changed.',
    onChange: {
      description: 'Trigger action when the number is changed.',
      event: {
        value: 'The phone number value object with input, region, and phone_number fields.',
      },
    },
    onBlur: 'Trigger action event occurs when input loses focus.',
    onFocus: 'Trigger action when input gets focus.',
    onPressEnter: 'Trigger action when enter is pressed while text input is focused.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: false },
      allowedRegions: {
        type: 'array',
        description:
          'List of allowed ISO 3166-1 alpha-2 region codes. If allowedRegions is [] or null, the default list of all regions is used.',
        items: {
          type: 'string',
        },
      },
      autoFocus,
      bordered: {
        ...bordered,
        description:
          'Whether or not the text input has a border style. Deprecated, use variant instead.',
      },
      defaultRegion: {
        type: 'string',
        description: 'The dial code of the default region to be used.',
      },
      disabled,
      maxLength: {
        type: 'integer',
        description: 'The max number of input characters.',
      },
      placeholder,
      prefix: {
        type: 'string',
        description: 'Prefix text for the block, priority over $prefix_con.',
      },
      prefixIcon: {
        ...icon,
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to prefix the text input.",
      },
      label,
      replaceInput: {
        type: 'object',
        description: 'Regex used to sanitize input.',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regular expression pattern to use to sanitize input.',
          },
          flags: {
            type: 'string',
            description: "The regex flags to use. The default value is 'gm'.",
          },
          replacement: {
            type: 'string',
            description:
              "The string used to replace the input that matches the pattern. The default value is ''.",
          },
        },
        docs: {
          displayType: 'yaml',
        },
      },
      showArrow: {
        type: 'boolean',
        default: true,
        description: 'Show the suffix icon at the drop-down position of the selector.',
      },
      size: sizeSmallMiddleLarge,
      suffix: {
        type: 'string',
        description: 'Suffix text for the block, priority over suffixIcon.',
      },
      suffixIcon: {
        ...icon,
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to suffix the text input.",
      },
      title: inputTitle,
      variant,
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
            description: 'Border color when the input is focused.',
          },
          activeShadow: {
            type: 'string',
            description: 'Box shadow when the input is focused.',
          },
          addonBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of addon elements.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the input.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the input.',
          },
          colorError: {
            type: 'string',
            description: 'Color used for error status.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the input value.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text color when input is disabled.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Color of the placeholder text.',
          },
          colorWarning: {
            type: 'string',
            description: 'Color used for warning status.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large inputs.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small inputs.',
          },
          errorActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 38, 5, 0.06)',
            description: 'Box shadow when the input has error status and is focused.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the input.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when the input is hovered.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding.',
          },
          warningActiveShadow: {
            type: 'string',
            default: '0 0 0 2px rgba(255, 215, 5, 0.1)',
            description: 'Box shadow when the input has warning status and is focused.',
          },
        },
      },
    },
  },
};
