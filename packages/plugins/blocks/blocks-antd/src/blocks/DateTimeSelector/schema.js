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
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        type: 'boolean',
        default: true,
        description: 'Allow the user to clear their input.',
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description:
          "Deprecated - use variant: 'borderless'. Whether or not the input has a border style.",
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless'],
        default: 'outlined',
        description: "Variant style of the input. Use 'borderless' instead of bordered: false.",
      },
      disabledDates: {
        type: 'object',
        description: 'Disable specific dates so that they can not be chosen.',
        properties: {
          min: {
            type: ['string', 'object'],
            description:
              'Disable all dates less than the minimum date. Can be a date string or a _date object.',
            docs: {
              displayType: 'date',
            },
          },
          max: {
            type: ['string', 'object'],
            description:
              'Disable all dates greater than the maximum date. Can be a date string or a _date object.',
            docs: {
              displayType: 'date',
            },
          },
          dates: {
            type: 'array',
            description:
              'Array of specific dates to be disabled. Can be date strings or a _date objects.',
            items: {
              type: ['string', 'object'],
              description: 'Specific dates to be disabled.',
              docs: {
                displayType: 'date',
              },
            },
          },
          ranges: {
            type: 'array',
            description:
              'Array of array pairs of start and end dates be disabled. Can be date strings or a _date objects.',
            items: {
              type: 'array',
              description: 'Specific date ranges to be disabled.',
              items: {
                type: ['string', 'object'],
              },
              docs: {
                displayType: 'dateRange',
              },
            },
          },
        },
      },
      format: {
        type: 'string',
        default: 'YYYY-MM-DD HH:mm',
        description:
          'Format in which to parse the date value, eg. "DD MMMM YYYY" will parse a date value of 1999-12-31 as "31 December 1999". The format has to conform to dayjs formats.',
      },
      hourStep: {
        type: 'integer',
        default: 1,
        minimum: 1,
        description: 'Hour intervals to show in the time selector.',
      },
      label: {
        type: 'object',
        description: 'Label properties.',
        additionalProperties: false,
        properties: {
          align: {
            type: 'string',
            enum: ['left', 'right'],
            default: 'left',
            description: 'Align label left or right when inline.',
          },
          colon: {
            type: 'boolean',
            default: true,
            description: 'Append label with colon.',
          },
          extra: {
            type: 'string',
            description: 'Extra text to display beneath the content - supports html.',
          },
          title: {
            type: 'string',
            description: 'Label title - supports html.',
          },
          span: {
            type: 'number',
            description: 'Label inline span.',
          },
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Hide input label.',
          },
          hasFeedback: {
            type: 'boolean',
            default: true,
            description:
              'Display feedback extra from validation, this does not disable validation.',
          },
          inline: {
            type: 'boolean',
            default: false,
            description: 'Render input and label inline.',
          },
        },
      },
      minuteStep: {
        type: 'integer',
        default: 5,
        minimum: 1,
        description: 'Minute intervals to show in the time selector.',
      },
      placeholder: {
        type: 'string',
        default: 'Select Date & Time',
        description: 'Placeholder text inside the block before user types input.',
      },
      secondStep: {
        type: 'integer',
        default: 5,
        minimum: 1,
        description: 'Minute intervals to show in the time selector.',
      },
      selectUTC: {
        type: 'boolean',
        default: false,
        description: "Shows the user's selection as UTC time, not time-zone based.",
      },
      showToday: {
        type: 'boolean',
        default: true,
        description: 'Shows a button to easily select the current date if true.',
      },
      showNow: {
        type: 'boolean',
        default: true,
        description: "Shows a 'Now' button to set current time.",
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      suffixIcon: {
        type: ['string', 'object'],
        default: 'AiOutlineCalendar',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on right-hand side of the date picker.",
        docs: {
          displayType: 'icon',
        },
      },
      timeFormat: {
        type: 'string',
        default: 'HH:mm',
        description:
          'Time format to show in the time selector. HH:mm:ss will show hours, minutes and seconds, HH:mm only hours and minutes and HH only hours.',
      },
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/date-picker#design-token',
        },
        properties: {
          cellHeight: {
            type: 'number',
            default: 24,
            description: 'Height of a calendar cell.',
          },
          cellWidth: {
            type: 'number',
            default: 36,
            description: 'Width of a calendar cell.',
          },
          cellHoverBg: {
            type: 'string',
            description: 'Background color of a calendar cell on hover.',
          },
          cellActiveWithRangeBg: {
            type: 'string',
            description: 'Background color of cells within the selected range.',
          },
          cellHoverWithRangeBg: {
            type: 'string',
            description: 'Background color of cells within range on hover.',
          },
          cellBgDisabled: {
            type: 'string',
            description: 'Background color of disabled cells.',
          },
          cellRangeBorderColor: {
            type: 'string',
            description: 'Border color of range selection cells.',
          },
          timeColumnWidth: {
            type: 'number',
            default: 56,
            description: 'Width of the time panel column.',
          },
          timeColumnHeight: {
            type: 'number',
            default: 224,
            description: 'Height of the time panel column.',
          },
          timeCellHeight: {
            type: 'number',
            default: 28,
            description: 'Height of a time cell in the time panel.',
          },
          addonBg: {
            type: 'string',
            description: 'Background color for the addon area.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color on hover.',
          },
          activeBorderColor: {
            type: 'string',
            description: 'Border color when active.',
          },
          activeShadow: {
            type: 'string',
            description: 'Shadow effect when active.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding of the input.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for small size.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for large size.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding of the input.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small size.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for large size.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the picker popup.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large size.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small size.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the input.',
          },
          colorText: {
            type: 'string',
            description: 'Text color.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Placeholder text color.',
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
        description: 'Trigger actions when selection is changed.',
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback', 'popup'],
};

export default schema;
