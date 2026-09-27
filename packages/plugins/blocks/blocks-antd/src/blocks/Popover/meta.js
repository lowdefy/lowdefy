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
    content: 'Blocks that trigger the Popover.',
    popover: 'Blocks inside the popup.',
  },
  cssKeys: {
    element: 'The Popover element.',
    inner: 'The Popover inner.',
    title: 'The Popover title.',
    content: 'The Popover content.',
  },
  events: {
    onOpenChange: {
      description: 'Trigger actions when visibility of the popover card is changed.',
      event: { open: 'True when the popover opened, false when it closed.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      arrow: {
        type: ['boolean', 'object'],
        default: true,
        description:
          'Whether to show the arrow. Set `{ pointAtCenter: true }` to point the arrow at the center of the target.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          pointAtCenter: {
            type: 'boolean',
            default: false,
            description: 'Whether the arrow is pointed at the center of target.',
          },
        },
      },
      destroyOnHidden: {
        type: 'boolean',
        default: false,
        description:
          'Unmount the blocks inside the popover when it closes, so they mount again each time it opens.',
      },
      title: {
        type: 'string',
        description: 'Title of the card - supports html.',
      },
      color: {
        type: 'string',
        description: 'Popover background color.',
        docs: {
          displayType: 'color',
        },
      },
      defaultOpen: {
        type: 'boolean',
        description: 'Whether the popover is open by default.',
        default: false,
      },
      autoAdjustOverflow: {
        type: 'boolean',
        description: 'Whether to adjust popup placement automatically when popup is off screen',
        default: true,
      },
      placement: {
        type: 'string',
        description: 'Placement of the popover.',
        enum: [
          'top',
          'topLeft',
          'topRight',
          'left',
          'leftTop',
          'leftBottom',
          'right',
          'rightTop',
          'rightBottom',
          'bottom',
          'bottomLeft',
          'bottomRight',
        ],
        default: 'top',
      },
      trigger: {
        type: 'string',
        description:
          'Trigger mode which executes the popover. `contextMenu` opens the popover on right click.',
        enum: ['hover', 'click', 'focus', 'contextMenu'],
        default: 'hover',
      },
      zIndex: {
        type: 'number',
        description: 'Z-index of the popover.',
      },
      overlayInnerStyle: {
        type: 'object',
        description: 'Style of overlay inner div. Prefer `style.inner`.',
        docs: {
          displayType: 'yaml',
        },
      },
      mouseEnterDelay: {
        type: 'number',
        description: 'Delay in seconds, before the popover is shown on mouse enter.',
        default: 0.1,
      },
      mouseLeaveDelay: {
        type: 'number',
        description: 'Delay in seconds, before the popover is hidden on mouse leave.',
        default: 0.1,
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/popover#design-token',
        },
        properties: {
          width: {
            type: ['number', 'string'],
            description: 'Width of the popover.',
          },
          minWidth: {
            type: ['number', 'string'],
            description: 'Minimum width of the popover.',
          },
          titleMinWidth: {
            type: ['number', 'string'],
            default: 177,
            description: 'Minimum width of the popover when it has a title.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1030,
            description: 'Z-index of the popover.',
          },
          innerPadding: {
            type: ['number', 'string'],
            default: 12,
            description: 'Padding inside the popover content area.',
          },
          titlePadding: {
            type: ['number', 'string'],
            description: 'Padding of the title area.',
          },
          titleMarginBottom: {
            type: 'number',
            default: 8,
            description: 'Margin bottom of the title.',
          },
          titleBorderBottom: {
            type: 'string',
            default: 'none',
            description: 'Border bottom of the title area.',
          },
          innerContentPadding: {
            type: ['number', 'string'],
            default: 0,
            description: 'Padding of the inner content area.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color of the popover.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the popover container.',
          },
        },
      },
    },
  },
};
