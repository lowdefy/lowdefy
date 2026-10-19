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
import label from '../../schemas/inputLabel.js';
import {
  allowClear,
  autoFocus,
  bordered,
  disabled,
  inputTitle,
  sizeSmallDefaultLarge,
  theme,
  variant,
  webIcon,
} from '../../schemas/inputProperties.js';

const primitiveOption = {
  type: ['string', 'number', 'boolean'],
};

const ignored = { nativeIgnored: true, description: 'Ignored on mobile.' };

export default {
  category: 'input',
  icons: ['Check', 'ChevronsUpDown', 'Search', 'X'],
  valueType: 'array',
  cssKeys: {
    element: 'The MultipleSelector box, or the row of the sheet variant.',
    label: 'The MultipleSelector label.',
    extra: 'The MultipleSelector extra content.',
    feedback: 'The MultipleSelector validation feedback.',
    value: 'The chosen labels text.',
  },
  events: {
    onChange: {
      description:
        'Trigger actions when the selection is changed. On mobile it fires once, as the picker sheet closes, when the set of values changed; with `changeOn: toggle` on each toggle.',
      event: { value: 'The selected values.' },
    },
    onBlur: 'Trigger action event occurs when selector loses focus. Never fires on mobile.',
    onFocus: 'Trigger action when selector gets focus. Never fires on mobile.',
    onClear:
      'Trigger action when selector gets cleared. Never fires on mobile: there is no clear button; unchecking every option sets an empty list.',
    onOpenChange: {
      description:
        'Trigger actions when the dropdown, or the picker sheet on mobile, opens or closes.',
      event: { open: 'Whether the dropdown is open.' },
    },
    onSearch: {
      description: 'Trigger actions when input is changed. Never fires on mobile.',
      event: { value: 'The search input value.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked. Never fires on mobile.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        ...allowClear,
        default: true,
        nativeIgnored: true,
        description: 'Ignored on mobile: unchecking every option in the sheet clears the value.',
      },
      allowCreate: {
        type: 'boolean',
        default: false,
        description:
          'Mobile only. Offer to add the search text as a new value, in a row at the top of the sheet, while it is no option label or value. The search field shows whatever the number of options. An added value is chosen, and stays an option while the block is shown.',
      },
      autoClearSearchValue: { type: 'boolean', ...ignored },
      autoFocus: { ...autoFocus, ...ignored },
      bordered,
      changeOn: {
        type: 'string',
        enum: ['close', 'toggle'],
        default: 'close',
        description:
          "Mobile only. When the value is set and onChange fires: 'close' once, as the sheet closes, if the set of values changed; 'toggle' on each option checked or unchecked.",
      },
      clearIcon: webIcon,
      createPattern: {
        type: 'string',
        description:
          'Mobile only. A regular expression a new value (`allowCreate`) must match, such as `^[a-z0-9]+(-[a-z0-9]+)*$`. Text it refuses cannot be added.',
      },
      createPatternMessage: {
        type: 'string',
        description:
          'Mobile only. The message the add row shows while the search text does not match `createPattern`.',
      },
      disabled,
      label,
      listHeight: { type: 'number', ...ignored },
      loadingPlaceholder: { type: 'string', ...ignored },
      maxCount: {
        type: 'number',
        description:
          'The most options that can be chosen. Once that many are chosen, the others and the add row are disabled.',
      },
      maxTagCount: { type: ['number', 'string'], ...ignored },
      menuTitle: {
        type: 'string',
        description:
          'Mobile only. A title centred in the sheet header (the MultipleSelector title by default).',
      },
      notFoundContent: { type: 'string', ...ignored },
      options: {
        default: [],
        description:
          'Options to pick from: primitives, or objects with a label and a value. Labels show as plain text on mobile.',
        oneOf: [
          { type: 'array', items: primitiveOption },
          {
            type: 'array',
            items: {
              type: 'object',
              required: ['value'],
              properties: {
                label: { type: 'string', description: 'Option label.' },
                value: { description: 'The value the option adds. Can be any type.' },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description:
                    'Disable the option. The sheet shows it dimmed, and it cannot be checked or unchecked.',
                },
                description: {
                  type: 'string',
                  description: 'Mobile only. A line of secondary text under the option label.',
                },
                symbol: {
                  type: 'string',
                  description:
                    'Mobile only. An SF Symbol name drawn beside the option in the sheet, on iOS.',
                },
                icon: {
                  type: 'string',
                  description:
                    'Mobile only. An icon name from the app icon data, drawn beside the option in the sheet where there is no SF Symbol (Android, or an option without symbol).',
                },
                iconColor: {
                  type: 'string',
                  description:
                    'Mobile only. The colour of the glyph in the sheet: a palette hue (`amber`, `blue`), a theme token (`colorPrimary`, `colorTint`) or a colour value.',
                },
                avatar: {
                  type: 'object',
                  description:
                    'Mobile only. A person the option stands for, drawn as an avatar (their picture, or initials) beside the option in the sheet.',
                  properties: {
                    name: { type: 'string', description: 'The name the initials are taken from.' },
                    src: {
                      type: 'string',
                      description: 'A picture url or SVG data URI, drawn in place of the initials.',
                    },
                    color: { type: 'string', description: 'The circle colour.' },
                  },
                },
                color: { type: 'string', ...ignored },
                filterString: { type: 'string', ...ignored },
                style: { type: 'object', ...ignored },
                tag: { type: 'object', ...ignored },
              },
            },
          },
        ],
      },
      placeholder: {
        type: 'string',
        default: 'Select items',
        description:
          'Placeholder text shown while nothing is chosen. The mobile sheet variant shows "None" by default.',
      },
      placement: { type: 'string', ...ignored },
      popupMatchSelectWidth: { type: ['boolean', 'number'], ...ignored },
      prefix: { type: 'string', ...ignored },
      prefixIcon: webIcon,
      removeIcon: webIcon,
      renderTags: { type: 'boolean', ...ignored },
      searchThreshold: {
        type: 'number',
        default: 7,
        description:
          'Mobile only. Show a search field above the options when there are more options than this. The search matches labels, ignoring case and accents.',
      },
      selectedIcon: webIcon,
      showArrow: { type: 'boolean', ...ignored },
      showSearch: { type: 'boolean', ...ignored },
      size: sizeSmallDefaultLarge,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      variant: {
        ...variant,
        enum: ['solid', 'outlined', 'filled', 'borderless', 'underlined', 'sheet'],
        description:
          "Input visual variant. On mobile every variant opens a bottom sheet of the options to check; 'sheet' draws the field as an iOS Settings-style row, the title at the left and the chosen labels at the right, and 'solid' draws the default field.",
      },
      virtual: { type: 'boolean', ...ignored },
    },
  },
};
