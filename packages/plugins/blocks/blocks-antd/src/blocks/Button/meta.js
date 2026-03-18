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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Button element.',
    icon: 'The icon in the Button.',
  },
  events: {
    onClick: 'Trigger action when button is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      block: {
        type: 'boolean',
        description: "Fit the button's span to its parent container span.",
        default: false,
      },
      color: {
        type: 'string',
        description:
          'Button color. Preset values: default, primary, danger, blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue, lime, gold. Also accepts custom hex color strings.',
        docs: {
          displayType: 'color',
        },
      },
      danger: {
        type: 'boolean',
        description: 'Set button style to danger.',
        default: false,
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the button if true.',
        default: false,
      },
      ghost: {
        type: 'boolean',
        description: "Make the button's background transparent when true.",
        default: false,
      },
      hideTitle: {
        type: 'boolean',
        description: "Hide the button's title.",
        default: false,
      },
      href: {
        type: 'string',
        description:
          'The URL to redirect to when the button is clicked. Useful when used with a type link button.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use icon in button.",
        docs: {
          displayType: 'icon',
        },
      },
      shape: {
        type: 'string',
        default: 'square',
        enum: ['circle', 'round', 'square'],
        description: 'Shape of the button.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the button.',
      },
      title: {
        type: 'string',
        description: 'Title text on the button - supports html.',
      },
      type: {
        type: 'string',
        default: 'primary',
        enum: ['primary', 'default', 'dashed', 'link', 'text'],
        description: 'Deprecated - use color and variant instead. The button type.',
      },
      variant: {
        type: 'string',
        enum: ['solid', 'outlined', 'dashed', 'filled', 'text', 'link'],
        description: 'Button visual variant. When set, takes precedence over type.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/button#design-token',
        },
        properties: {
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the button.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large buttons.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small buttons.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the button.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large buttons.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small buttons.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large buttons.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for small buttons.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          paddingInline: {
            type: 'number',
            default: 15,
            description: 'Horizontal padding.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 15,
            description: 'Horizontal padding for large buttons.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small buttons.',
          },
          paddingBlock: {
            type: 'number',
            default: 0,
            description: 'Vertical padding.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary hover color.',
          },
          colorPrimaryActive: {
            type: 'string',
            description: 'Primary active color.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color for default buttons.',
          },
          colorText: {
            type: 'string',
            description: 'Text color for default buttons.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color for outlined and dashed buttons.',
          },
        },
      },
    },
  },
};
