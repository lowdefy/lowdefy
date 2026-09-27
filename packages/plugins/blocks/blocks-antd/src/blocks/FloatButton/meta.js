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

import icon from '../../schemas/icon.js';

export default {
  category: 'display',
  icons: ['arrow-up', 'document'],
  valueType: null,
  cssKeys: {
    element: 'The FloatButton element.',
    icon: 'The icon in the FloatButton.',
  },
  events: {
    onClick:
      'Trigger action when button is clicked. With `backTop`, fires after the page starts scrolling to the top.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: {
        type: 'string',
        enum: ['default', 'primary'],
        default: 'default',
        description: 'Setting button type.',
      },
      shape: {
        type: 'string',
        enum: ['circle', 'square'],
        default: 'circle',
        description: 'Setting button shape.',
      },
      description: {
        type: 'string',
        description: 'Text shown below the icon. Use a square shape for room to show it.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the button.',
      },
      backTop: {
        type: 'boolean',
        default: false,
        description:
          'Render a back to top button. It shows once the page scrolls past `visibilityHeight` and scrolls the page to the top when clicked.',
      },
      visibilityHeight: {
        type: 'number',
        default: 400,
        description:
          'Scroll height in pixels after which the back to top button shows. Only applies with `backTop`.',
      },
      duration: {
        type: 'number',
        default: 450,
        description:
          'Time in milliseconds to scroll back to the top. Only applies with `backTop`. Ignored when the user prefers reduced motion.',
      },
      showProgress: {
        type: 'boolean',
        default: false,
        description:
          'Show the scroll progress as a ring around the back to top button. Only applies with `backTop`.',
      },
      tooltip: {
        type: 'string',
        description: 'The text shown in the tooltip.',
      },
      icon: {
        ...icon,
        description: 'Icon for the button.',
      },
      href: {
        type: 'string',
        description: 'The target of hyperlink. Not used with `backTop`.',
      },
      htmlType: {
        type: 'string',
        enum: ['button', 'submit', 'reset'],
        default: 'button',
        description: 'HTML button type.',
      },
      target: {
        type: 'string',
        description: 'Specifies where to display the linked URL.',
      },
      badge: {
        type: 'object',
        description: 'Badge configuration for the button.',
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
          link: 'https://ant.design/components/float-button#design-token',
        },
        properties: {
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Badge dot size.',
          },
          badgeColor: {
            type: 'string',
            description: 'Badge color.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for square shape.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color for primary type button.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Hover color for primary type button.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color for default type button.',
          },
          colorText: {
            type: 'string',
            description: 'Text and icon color.',
          },
          colorTextLightSolid: {
            type: 'string',
            description: 'Text color on primary background.',
          },
          boxShadowSecondary: {
            type: 'string',
            description: 'Shadow for the float button.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size.',
          },
          fontSizeIcon: {
            type: 'number',
            default: 18,
            description: 'Icon font size.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Controls the float button size.',
          },
        },
      },
    },
  },
};
