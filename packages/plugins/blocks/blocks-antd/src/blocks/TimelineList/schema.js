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
      data: {
        type: 'array',
        docs: {
          displayType: 'yaml',
        },
      },
      pendingDotIcon: {
        type: ['object', 'string'],
        description: 'Set the dot of the last ghost node when pending is true.',
        docs: {
          displayType: 'icon',
        },
      },
      pending: {
        type: 'boolean',
        default: false,
        description: "Set the last ghost node's existence or its content.",
      },
      reverse: {
        type: 'boolean',
        default: false,
        description: 'Reverse timeline nodes.',
      },
      iconField: {
        type: 'string',
        description: "Use a custom icon field. Defaults to 'icon'.",
      },
      styleField: {
        type: 'string',
        description: "Use a custom style field. Defaults to 'style'.",
      },
      colorField: {
        type: 'string',
        description: "Use a custom color field. Defaults to 'color'.",
      },
      positionField: {
        type: 'string',
        description: "Use a custom position field. Defaults to 'position'.",
      },
      labelField: {
        type: 'string',
        description: "Use a custom label field. Defaults to 'label'.",
      },
      mode: {
        type: 'string',
        enum: ['left', 'right', 'alternate'],
        default: 'left',
        description:
          'By sending alternate the timeline will distribute the nodes to the left and right.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/timeline#design-token',
        },
        properties: {
          tailColor: {
            type: 'string',
            default: 'rgba(5, 5, 5, 0.06)',
            description: 'Color of the timeline connector line.',
          },
          tailWidth: {
            type: 'number',
            default: 2,
            description: 'Width of the timeline connector line.',
          },
          dotBorderWidth: {
            type: 'number',
            default: 2,
            description: 'Border width of the timeline dot.',
          },
          dotBg: {
            type: 'string',
            description: 'Background color of the timeline dot.',
          },
          itemPaddingBottom: {
            type: 'number',
            default: 20,
            description: 'Bottom padding of each timeline item.',
          },
        },
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
