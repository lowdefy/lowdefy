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
        default: 'line',
        enum: ['line', 'circle', 'dashboard'],
        description: 'Set type of progress display.',
      },
      showInfo: {
        type: 'boolean',
        default: true,
        description: 'Whether to display the progress value and the status icon.',
      },
      percent: {
        type: 'number',
        default: 0,
        description: 'Set the completion percentage.',
      },
      status: {
        type: 'string',
        enum: ['success', 'exception', 'normal', 'active'],
        default: 'normal',
        description: 'Set the status of the Progress.',
      },
      strokeLinecap: {
        type: 'string',
        default: 'round',
        enum: ['round', 'square'],
        description: 'Set the style of the progress linecap.',
      },
      strokeColor: {
        type: ['string', 'object'],
        description: 'Color of progress bar.',
        docs: {
          displayType: 'color',
        },
      },
      success: {
        type: 'object',
        description: 'Segmented success percent configuration.',
        properties: {
          percent: {
            type: 'number',
            default: 0,
            description: 'Segmented success percent.',
          },
          strokeColor: {
            type: 'string',
            description: 'Color of the success segment.',
            docs: {
              displayType: 'color',
            },
          },
        },
      },
      trailColor: {
        type: 'string',
        description: 'Color of unfilled part.',
        docs: {
          displayType: 'color',
        },
      },
      strokeWidth: {
        type: 'number',
        description: 'Set the width of the progress bar.',
      },
      width: {
        type: 'number',
        default: 132,
        description: 'Set the canvas width of the circular progress.',
      },
      gapDegree: {
        type: 'number',
        default: 75,
        description: 'The gap degree of half circle.',
      },
      gapPosition: {
        type: 'string',
        enum: ['top', 'bottom', 'left', 'right'],
        default: 'top',
        description: 'The gap position.',
      },
      steps: {
        type: 'number',
        description: 'Number of steps for a segmented progress bar (line type only).',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/progress#design-token',
        },
        properties: {
          defaultColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Default color of the progress bar.',
          },
          remainingColor: {
            type: 'string',
            default: 'rgba(0,0,0,0.06)',
            description: 'Color of the unfilled portion of the progress bar.',
          },
          circleTextColor: {
            type: 'string',
            default: 'rgba(0,0,0,0.88)',
            description: 'Text color inside the circular progress.',
          },
          circleTextFontSize: {
            type: 'string',
            default: '1em',
            description: 'Font size of text inside the circular progress.',
          },
          circleIconFontSize: {
            type: 'string',
            default: '1.167em',
            description: 'Font size of icons inside the circular progress.',
          },
          lineBorderRadius: {
            type: 'number',
            default: 100,
            description: 'Border radius of the linear progress bar.',
          },
          colorSuccess: {
            type: 'string',
            description: 'Color used for success status.',
          },
          colorError: {
            type: 'string',
            description: 'Color used for exception status.',
          },
        },
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
