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

import disabledDates from '../../schemas/disabledDates.js';

export default {
  category: 'input',
  icons: [],
  valueType: 'date',
  cssKeys: {
    element: 'The Calendar element.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when the selected date changes.',
      event: {
        value: 'The selected Date object.',
        date: 'The selected date as YYYY-MM-DD string.',
      },
    },
    onSelect: {
      description: 'Trigger actions when a date cell is clicked.',
      event: {
        value: 'The selected Date object.',
        date: 'The selected date as YYYY-MM-DD string.',
        source: 'The source of the selection (date, month, year).',
      },
    },
    onPanelChange: {
      description: 'Trigger actions when the calendar panel mode or date changes.',
      event: {
        value: 'The panel Date object.',
        date: 'The panel date as YYYY-MM-DD string.',
        mode: 'The panel mode (month or year).',
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      fullscreen: {
        type: 'boolean',
        default: true,
        description:
          'Whether to display the calendar in full size. Set to false for a compact card-style calendar.',
      },
      mode: {
        type: 'string',
        enum: ['month', 'year'],
        default: 'month',
        description: 'The display mode of the calendar panel.',
      },
      disabledDates,
      validRange: {
        type: 'array',
        description:
          'Set the valid date range as [startDate, endDate]. Dates outside this range will be disabled.',
        items: {
          type: 'string',
        },
      },
      dateCellData: {
        type: 'array',
        description:
          'Data to display inside calendar date cells. Each item renders as a Badge in the corresponding date cell.',
        items: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'The date for this cell data (ISO date string).',
            },
            content: {
              type: 'string',
              description: 'Text to display in the date cell.',
            },
            status: {
              type: 'string',
              enum: ['success', 'processing', 'default', 'error', 'warning'],
              description: 'Badge status type.',
            },
            color: {
              type: 'string',
              description: 'Custom badge color.',
              docs: {
                displayType: 'color',
              },
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
          link: 'https://ant.design/components/calendar#design-token',
        },
        properties: {
          fullBg: {
            type: 'string',
            description: 'Background color of the full-size calendar.',
          },
          fullPanelBg: {
            type: 'string',
            description: 'Background color of the calendar panel in full-size mode.',
          },
          itemActiveBg: {
            type: 'string',
            description: 'Background color of the active/selected date.',
          },
          yearControlWidth: {
            type: 'number',
            default: 80,
            description: 'Width of the year select control in the header.',
          },
          monthControlWidth: {
            type: 'number',
            default: 70,
            description: 'Width of the month select control in the header.',
          },
          miniContentHeight: {
            type: 'number',
            default: 256,
            description: 'Height of the content area in mini (non-fullscreen) mode.',
          },
        },
      },
    },
  },
};
