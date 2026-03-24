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
import { disabled, inputTitle, autoFocus } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'AiOutlineCheck', 'AiOutlineClose'],
  valueType: 'boolean',
  cssKeys: {
    element: 'The Switch element.',
    checkedIcon: 'The checked icon in the Switch.',
    label: 'The Switch label.',
    extra: 'The Switch extra content.',
    feedback: 'The Switch validation feedback.',
    uncheckedIcon: 'The unchecked icon in the Switch.',
  },
  events: {
    onChange: {
      description: 'Trigger action when switch is changed.',
      event: { value: 'The switch value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus,
      checkedIcon: {
        ...icon,
        default: 'AiOutlineCheck',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to shown when switch is checked (true).",
      },
      checkedText: {
        type: 'string',
        description: 'Text to shown when switch is checked (true).',
      },
      color: {
        type: 'string',
        description: 'Switch checked color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled,
      label,
      size: {
        type: 'string',
        enum: ['small', 'default'],
        default: 'default',
        description: 'Size of the block.',
      },
      title: inputTitle,
      uncheckedIcon: {
        ...icon,
        default: 'AiOutlineClose',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to shown when switch is unchecked (false).",
      },
      uncheckedText: {
        type: 'string',
        description: 'Text to shown when switch is not checked (false).',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/switch#design-token',
        },
        properties: {
          trackHeight: {
            type: 'number',
            default: 22,
            description: 'Height of the switch track.',
          },
          trackHeightSM: {
            type: 'number',
            default: 16,
            description: 'Height of the switch track for small size.',
          },
          trackMinWidth: {
            type: 'number',
            default: 44,
            description: 'Minimum width of the switch track.',
          },
          trackMinWidthSM: {
            type: 'number',
            default: 28,
            description: 'Minimum width of the switch track for small size.',
          },
          trackPadding: {
            type: 'number',
            default: 2,
            description: 'Internal padding of the switch track.',
          },
          handleBg: {
            type: 'string',
            default: '#fff',
            description: 'Background color of the switch handle.',
          },
          handleSize: {
            type: 'number',
            default: 18,
            description: 'Diameter of the switch handle.',
          },
          handleSizeSM: {
            type: 'number',
            default: 12,
            description: 'Diameter of the switch handle for small size.',
          },
          handleShadow: {
            type: 'string',
            default: '0 2px 4px 0 rgba(0,35,11,0.2)',
            description: 'Box shadow of the switch handle.',
          },
          innerMinMargin: {
            type: 'number',
            default: 9,
            description: 'Minimum margin for inner content (text/icon) of the switch.',
          },
          innerMaxMargin: {
            type: 'number',
            default: 24,
            description: 'Maximum margin for inner content (text/icon) of the switch.',
          },
          innerMinMarginSM: {
            type: 'number',
            default: 6,
            description: 'Minimum margin for inner content for small size.',
          },
          innerMaxMarginSM: {
            type: 'number',
            default: 18,
            description: 'Maximum margin for inner content for small size.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color when the switch is checked.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary color on hover when the switch is checked.',
          },
          colorTextQuaternary: {
            type: 'string',
            description: 'Background color when the switch is unchecked.',
          },
          colorTextTertiary: {
            type: 'string',
            description: 'Background color on hover when the switch is unchecked.',
          },
        },
      },
    },
  },
};
