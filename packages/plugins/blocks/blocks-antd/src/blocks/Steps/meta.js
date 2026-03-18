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
    element: 'The Steps element.',
    icon: 'The icon in the Steps.',
  },
  events: {
    onChange: {
      description: 'Triggered when a step is clicked.',
      event: { current: 'The index of the clicked step.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      current: {
        type: 'number',
        default: 0,
        description: 'Index of the current step, counting from 0.',
      },
      initial: {
        type: 'number',
        default: 0,
        description: 'Starting index of the steps, counting from 0.',
      },
      status: {
        type: 'string',
        default: 'process',
        enum: ['wait', 'process', 'finish', 'error'],
        description: 'Status of current step.',
      },
      size: {
        type: 'string',
        default: 'default',
        enum: ['default', 'small'],
        description: 'Size of the steps.',
      },
      type: {
        type: 'string',
        default: 'default',
        enum: ['default', 'dot', 'inline', 'navigation', 'panel'],
        description: 'Type of steps.',
      },
      orientation: {
        type: 'string',
        default: 'horizontal',
        enum: ['horizontal', 'vertical'],
        description: 'Orientation of the step bar.',
      },
      titlePlacement: {
        type: 'string',
        default: 'horizontal',
        enum: ['horizontal', 'vertical'],
        description: 'Place title and description horizontal or vertical.',
      },
      percent: {
        type: 'number',
        description:
          'Progress circle percentage of current step in process status (only works with type default).',
      },
      progressDot: {
        type: 'boolean',
        default: false,
        description: 'Steps with progress dot style.',
      },
      variant: {
        type: 'string',
        enum: ['filled', 'outlined'],
        default: 'filled',
        description: 'Style variant of the steps.',
      },
      responsive: {
        type: 'boolean',
        default: true,
        description: 'Change to vertical direction when screen width smaller than 532px.',
      },
      items: {
        type: 'array',
        description: 'List of step items.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the step - supports html.',
            },
            subTitle: {
              type: 'string',
              description: 'Subtitle of the step - supports html.',
            },
            description: {
              type: 'string',
              description: 'Description of the step - supports html.',
            },
            icon: {
              type: ['string', 'object'],
              description:
                "Name of a React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use as the step icon.",
              docs: {
                displayType: 'icon',
              },
            },
            status: {
              type: 'string',
              enum: ['wait', 'process', 'finish', 'error'],
              description: 'Status of this step, overrides the current step status.',
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Disable click on this step.',
            },
          },
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/steps#design-token',
        },
        properties: {
          colorPrimary: {
            type: 'string',
            default: '#1677ff',
            description: 'Primary color for the active step.',
          },
          dotCurrentSize: {
            type: 'number',
            default: 10,
            description: 'Size of the current dot in dot style.',
          },
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Size of dots in dot style.',
          },
          iconFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the step icon.',
          },
          iconSize: {
            type: 'number',
            default: 32,
            description: 'Size of the step icon.',
          },
          iconSizeSM: {
            type: 'number',
            default: 24,
            description: 'Size of the small step icon.',
          },
          iconTop: {
            type: 'number',
            default: -0.5,
            description: 'Top position of the step icon.',
          },
          descriptionMaxWidth: {
            type: 'number',
            default: 140,
            description: 'Max width of the step description.',
          },
          titleLineHeight: {
            type: 'number',
            default: 32,
            description: 'Line height of the step title.',
          },
          navArrowColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Color of the navigation arrow.',
          },
          navContentMaxWidth: {
            type: 'string',
            default: 'auto',
            description: 'Max width of navigation step content.',
          },
          finishIconBorderColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Border color of finished step icon.',
          },
          waitIconBorderColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Border color of waiting step icon.',
          },
          waitIconColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Color of waiting step icon.',
          },
        },
      },
    },
  },
};
