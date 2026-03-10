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
        description: 'Text and other.',
      },
      tooltip: {
        type: 'string',
        description: 'The text shown in the tooltip.',
      },
      icon: {
        type: ['string', 'object'],
        description: 'Icon for the button.',
        docs: {
          displayType: 'icon',
        },
      },
      href: {
        type: 'string',
        description: 'The target of hyperlink.',
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
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Trigger action when button is clicked.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
