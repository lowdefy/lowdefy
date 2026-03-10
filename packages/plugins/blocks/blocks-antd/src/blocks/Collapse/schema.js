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
      accordion: {
        type: 'boolean',
        default: false,
        description: 'If true, only one panel is open at a time.',
      },
      activeKey: {
        type: 'string',
        description: "Current panel's key.",
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Toggles rendering of the border around the collapse block.',
      },
      defaultActiveKey: {
        type: 'string',
        description: "Initial active panel's key, if activeKey is not set.",
      },
      destroyInactivePanel: {
        type: 'boolean',
        default: false,
        description: 'Destroy inactive panel.',
      },
      expandIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block for expand icon on the right of selector.",
        docs: {
          displayType: 'icon',
        },
      },
      expandIconPlacement: {
        type: 'string',
        enum: ['start', 'end'],
        default: 'start',
        description: 'Set placement of the expand icon.',
      },
      forceRender: {
        type: 'boolean',
        default: 'false',
        description: 'Force render for all panels.',
      },
      panels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the panel - supports html.',
            },
            key: {
              type: 'string',
              description: 'Key of the panel.',
            },
            extraKey: {
              type: 'string',
              description: 'Key for the extra area of the panel.',
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Disable the panel if true.',
            },
          },
        },
      },
      showArrow: {
        type: 'boolean',
        default: true,
        description: 'Show expand icon.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/collapse#design-token',
        },
        properties: {
          headerPadding: {
            type: 'string',
            default: '12px 16px',
            description: 'Padding of the collapse header.',
          },
          headerBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of the collapse header.',
          },
          contentPadding: {
            type: 'string',
            default: '16px 16px',
            description: 'Padding of the collapse content area.',
          },
          contentBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the collapse content area.',
          },
          borderlessContentPadding: {
            type: 'string',
            default: '4px 16px 16px',
            description: 'Padding of the content area in borderless (ghost) style.',
          },
          borderlessContentBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the content area in borderless (ghost) style.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the collapse component.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the collapse container.',
          },
          colorText: {
            type: 'string',
            description: 'Text color for the collapse content.',
          },
          colorTextHeading: {
            type: 'string',
            description: 'Text color for the collapse header.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the collapse content.',
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
        description: 'Trigger actions when collapse item is toggled.',
      },
    },
  },
  cssKeys: ['element', 'header', 'content'],
};

export default schema;
