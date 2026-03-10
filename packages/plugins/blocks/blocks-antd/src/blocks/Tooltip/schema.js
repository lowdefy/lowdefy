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
      arrowPointAtCenter: {
        type: 'boolean',
        default: false,
        description: 'Whether the arrow is pointed at the center of target.',
      },
      autoAdjustOverflow: {
        type: 'boolean',
        default: true,
        description: 'Whether to adjust popup placement automatically when popup is off screen.',
      },
      overlayStyle: {
        type: 'object',
        description: 'Style of the tooltip card.',
        docs: {
          displayType: 'yaml',
        },
      },
      color: {
        type: 'string',
        description: 'The background color.',
        docs: {
          displayType: 'color',
        },
      },
      defaultOpen: {
        type: 'boolean',
        default: false,
        description: 'Whether the floating tooltip card is visible by default.',
      },
      destroyTooltipOnHide: {
        type: 'boolean',
        default: false,
        description: 'Whether to destroy the tooltip DOM when hidden.',
      },
      mouseEnterDelay: {
        type: 'number',
        default: 0.1,
        description: 'Delay in seconds, before tooltip is shown on mouse enter.',
      },
      mouseLeaveDelay: {
        type: 'number',
        default: 0.1,
        description: 'Delay in seconds, before tooltip is shown on mouse enter.',
      },
      placement: {
        type: 'string',
        enum: [
          'top',
          'left',
          'right',
          'bottom',
          'topLeft',
          'topRight',
          'bottomLeft',
          'bottomRight',
          'leftTop',
          'leftBottom',
          'rightTop',
          'rightBottom',
        ],
        default: 'top',
        description: 'The position of the tooltip relative to the target.',
      },
      trigger: {
        type: 'string',
        enum: ['hover', 'focus', 'click'],
        default: 'hover',
        description: 'Tooltip trigger mode.',
      },
      title: {
        type: 'string',
        description:
          'Title to show in the title area - supports html. Overwritten by blocks in the title content area.',
      },
      zIndex: {
        type: 'integer',
        description: 'The z-index of the Tooltip.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/tooltip#design-token',
        },
        properties: {
          zIndexPopup: {
            type: 'number',
            default: 1070,
            description: 'Z-index of the tooltip.',
          },
          maxWidth: {
            type: 'number',
            default: 250,
            description: 'Maximum width of the tooltip.',
          },
          colorBgSpotlight: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.85)',
            description: 'Background color of the tooltip.',
          },
          colorTextLightSolid: {
            type: 'string',
            default: '#fff',
            description: 'Text color inside the tooltip.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the tooltip.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Minimum height of the tooltip.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of tooltip text.',
          },
          lineHeight: {
            type: 'number',
            default: 1.5714,
            description: 'Line height of tooltip text.',
          },
          paddingXS: {
            type: 'number',
            default: 8,
            description: 'Horizontal padding inside the tooltip.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onOpenChange: {
        type: 'array',
        description: 'Trigger action when visibility of the tooltip card is changed.',
      },
    },
  },
  cssKeys: ['element', 'inner'],
};

export default schema;
