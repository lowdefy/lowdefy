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
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Title of the card.',
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
        default: 'bottom',
      },
      trigger: {
        type: 'string',
        description: 'Trigger mode which executes the popover.',
        enum: ['hover', 'click', 'focus'],
        default: 'hover',
      },
      zIndex: {
        type: 'number',
        description: 'Z-index of the popover.',
      },
      overlayInnerStyle: {
        type: 'object',
        description: 'Style of overlay inner div.',
        docs: {
          displayType: 'yaml',
        },
      },
      mouseEnterDelay: {
        type: 'number',
        description: 'Delay in milliseconds, before tooltip is shown on mouse enter.',
        default: 0.1,
      },
      mouseLeaveDelay: {
        type: 'number',
        description: 'Delay in milliseconds, before tooltip is hidden on mouse leave.',
        default: 0.1,
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onOpenChange: {
        type: 'array',
        description: 'Trigger actions when visibility of the tooltip card is changed.',
      },
    },
  },
};
