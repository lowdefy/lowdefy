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
  slots: {
    content: 'Child blocks wrapped by the ConfigProvider.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      algorithm: {
        type: ['string', 'array'],
        description:
          'Theme algorithm. Can be "default", "dark", "compact", or an array of these values.',
        docs: {
          displayType: 'yaml',
        },
      },
      componentDisabled: {
        type: 'boolean',
        default: false,
        description:
          'Disable every input and button inside the ConfigProvider. A block that sets its own `disabled` property keeps that value, so `disabled: false` re-enables it.',
      },
      componentSize: {
        type: 'string',
        enum: ['small', 'medium', 'middle', 'large'],
        description: 'Set size for all child components. `middle` is the older name for `medium`.',
      },
      components: {
        type: 'object',
        description:
          'Component-level token overrides. Keys are component names, values are token objects.',
        docs: {
          displayType: 'yaml',
        },
      },
      direction: {
        type: 'string',
        enum: ['ltr', 'rtl'],
        default: 'ltr',
        description: 'Direction of layout.',
      },
      locale: {
        type: 'object',
        description:
          'Antd locale object to localize built-in component strings (date pickers, pagination, modal, form validation). Pair with the _locale operator and config.i18n to keep the whole subtree in one language.',
        docs: {
          displayType: 'yaml',
        },
      },
      popupMatchSelectWidth: {
        type: ['boolean', 'number'],
        description:
          'Whether dropdowns of select-like components match the width of their input. A number sets a minimum dropdown width in pixels. `false` also turns off virtual scrolling.',
      },
      popupOverflow: {
        type: 'string',
        enum: ['viewport', 'scroll'],
        default: 'viewport',
        description:
          'Keep dropdowns of select-like components inside the viewport, or let them follow the page scroll.',
      },
      token: {
        type: 'object',
        description:
          'Theme token configuration. Customize design tokens like colorPrimary, fontSize, etc.',
        docs: {
          displayType: 'yaml',
        },
      },
      virtual: {
        type: 'boolean',
        default: true,
        description:
          'Set to false to turn off virtual scrolling in selectors, trees and tables, so every option renders.',
      },
      wave: {
        type: 'object',
        description: 'Click wave effect of buttons and other clickable components.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Turn off the click wave effect.',
          },
        },
      },
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless', 'underlined'],
        description: 'Global input variant style for all child components.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block and its descendants. Merged with token, which takes precedence. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
