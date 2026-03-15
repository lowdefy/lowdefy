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

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'any',
  cssKeys: {
    element: 'The Slider element.',
    label: 'The Slider label.',
    extra: 'The Slider extra content.',
    feedback: 'The Slider validation feedback.',
  },
  events: {
    onChange: 'Trigger action when the slider value changes.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the slider if true.',
      },
      dots: {
        type: 'boolean',
        default: false,
        description: 'Whether to show dots on the slider track at each step.',
      },
      included: {
        type: 'boolean',
        default: true,
        description:
          'Whether the track between min and the current value is highlighted. Set to false to make it an independent point.',
      },
      marks: {
        type: 'object',
        description:
          'Tick marks on the slider. Keys are slider values and values are labels. Example: { 0: "0°C", 100: "100°C" }.',
        docs: {
          displayType: 'yaml',
        },
      },
      max: {
        type: 'number',
        default: 100,
        description: 'Maximum value of the slider.',
      },
      min: {
        type: 'number',
        default: 0,
        description: 'Minimum value of the slider.',
      },
      range: {
        type: 'boolean',
        default: false,
        description: 'Enable dual thumb mode for selecting a range.',
      },
      reverse: {
        type: 'boolean',
        default: false,
        description: 'Reverse the direction of the slider.',
      },
      step: {
        type: 'number',
        default: 1,
        description:
          'The granularity the slider can step through values. Must be greater than 0. Set to null for marks only.',
      },
      title: {
        type: 'string',
        description: 'Title to show in the label area - supports html.',
      },
      tooltip: {
        type: 'object',
        description:
          'Tooltip configuration for the slider handle. Example: { open: true } to always show, or { formatter: null } to hide.',
        docs: {
          displayType: 'yaml',
        },
      },
      vertical: {
        type: 'boolean',
        default: false,
        description: 'Whether the slider is vertical.',
      },
      label: {
        type: 'object',
        description: 'Label properties to pass to the wrapping Label block.',
        docs: {
          displayType: 'yaml',
        },
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/slider#design-token',
        },
        properties: {
          controlSize: {
            type: 'number',
            default: 10,
            description: 'Overall control dimension of the slider.',
          },
          railSize: {
            type: 'number',
            default: 4,
            description: 'Height (or width when vertical) of the slider rail.',
          },
          handleSize: {
            type: 'number',
            default: 10,
            description: 'Diameter of the slider handle.',
          },
          handleSizeHover: {
            type: 'number',
            default: 12,
            description: 'Diameter of the slider handle on hover.',
          },
          handleLineWidth: {
            type: 'number',
            default: 2,
            description: 'Border width of the slider handle.',
          },
          handleLineWidthHover: {
            type: 'number',
            default: 4,
            description: 'Border width of the slider handle on hover.',
          },
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Diameter of step dots on the slider track.',
          },
          railBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.04)',
            description: 'Background color of the slider rail.',
          },
          railHoverBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.06)',
            description: 'Background color of the slider rail on hover.',
          },
          trackBg: {
            type: 'string',
            default: '#91caff',
            description: 'Background color of the slider track (filled portion).',
          },
          trackHoverBg: {
            type: 'string',
            default: '#69b1ff',
            description: 'Background color of the slider track on hover.',
          },
          handleColor: {
            type: 'string',
            default: '#91caff',
            description: 'Color of the slider handle.',
          },
          handleActiveColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Color of the slider handle when active.',
          },
          handleActiveOutlineColor: {
            type: 'string',
            default: 'rgba(22,119,255,0.2)',
            description: 'Color of the focus outline around the active handle.',
          },
          handleColorDisabled: {
            type: 'string',
            default: '#bfbfbf',
            description: 'Color of the slider handle when disabled.',
          },
          dotBorderColor: {
            type: 'string',
            default: '#f0f0f0',
            description: 'Border color of step dots.',
          },
          dotActiveBorderColor: {
            type: 'string',
            default: '#91caff',
            description: 'Border color of active step dots.',
          },
          trackBgDisabled: {
            type: 'string',
            default: 'rgba(0,0,0,0.04)',
            description: 'Background color of the track when disabled.',
          },
          colorPrimaryBorderHover: {
            type: 'string',
            description: 'Primary border color on hover state.',
          },
        },
      },
    },
  },
};
