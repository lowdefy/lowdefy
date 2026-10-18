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
  placeholder,
  sizeSmallDefaultLarge,
  theme,
  variant,
  webIcon,
} from '../../schemas/inputProperties.js';

const primitiveOption = {
  type: ['string', 'number', 'boolean'],
};

export default {
  category: 'input',
  icons: ['Check', 'ChevronsUpDown', 'Search', 'X'],
  valueType: 'any',
  cssKeys: {
    element: 'The Selector box, or the row of the menu and sheet variants.',
    label: 'The Selector label.',
    extra: 'The Selector extra content.',
    feedback: 'The Selector validation feedback.',
    value: 'The chosen option text of the menu and sheet variants.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when an option is picked.',
      event: { value: 'The value of the picked option, or null for no value.' },
    },
    onClear: 'Trigger actions when the value is cleared.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        ...allowClear,
        default: true,
        description: 'Keep the placeholder in the picker, so the value can be cleared.',
      },
      appearance: {
        type: 'string',
        enum: ['menu', 'wheel'],
        default: 'menu',
        description:
          "Mobile only. 'menu' opens a menu of options; 'wheel' shows the iOS scroll wheel in place (Android shows a menu).",
      },
      autoFocus,
      bordered,
      disabled,
      label,
      options: {
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
                value: { description: 'The value the option sets. Can be any type.' },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description:
                    'Leave the option out of the picker. The menu and sheet variants show it dimmed.',
                },
                symbol: {
                  type: 'string',
                  description:
                    'Mobile menu and sheet variants only. An SF Symbol name drawn beside the option in the native menu or the sheet and, on iOS, beside the chosen option in the row.',
                },
                icon: {
                  type: 'string',
                  description:
                    'Mobile menu and sheet variants only. An icon name from the app icon data, drawn beside the option in the sheet and the chosen option in the row where there is no SF Symbol (Android, or an option without symbol).',
                },
                iconColor: {
                  type: 'string',
                  description:
                    'Mobile menu and sheet variants only. The colour of the glyph in the row and the sheet.',
                },
                avatar: {
                  type: 'object',
                  description:
                    'Mobile menu and sheet variants only. A person the option stands for, drawn as an avatar (their picture, or initials) beside the chosen option in the row and beside the option in the sheet; the native menu shows the person symbol.',
                  properties: {
                    name: { type: 'string', description: 'The name the initials are taken from.' },
                    src: {
                      type: 'string',
                      description: 'A picture url or SVG data URI, drawn in place of the initials.',
                    },
                    color: { type: 'string', description: 'The circle colour.' },
                  },
                },
                description: {
                  type: 'string',
                  description:
                    'Mobile sheet variant only. A line of secondary text under the option label, such as an email address.',
                },
                pinned: {
                  type: 'boolean',
                  default: false,
                  description:
                    'Mobile sheet variant only. Show the option in the group at the top of the sheet, under the placeholder item and above a hairline, such as "Assign to me".',
                },
                filterString: {
                  type: 'string',
                  nativeIgnored: true,
                  description: 'Ignored on mobile.',
                },
                style: { type: 'object', nativeIgnored: true, description: 'Ignored on mobile.' },
                tag: { type: 'object', nativeIgnored: true, description: 'Ignored on mobile.' },
              },
            },
          },
        ],
      },
      menuTitle: {
        type: 'string',
        description:
          'Mobile menu and sheet variants only. A title at the top of the menu, on iOS, or centred in the sheet header (the Selector title by default).',
      },
      placeholder: { ...placeholder, default: 'Select item' },
      searchThreshold: {
        type: 'number',
        default: 7,
        description:
          'Mobile sheet variant only. Show a search field above the options when there are more options than this. The search matches labels, ignoring case and accents.',
      },
      showSearch: {
        type: 'boolean',
        default: true,
        nativeIgnored: true,
        description: 'Ignored on mobile.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      variant: {
        ...variant,
        enum: ['solid', 'outlined', 'filled', 'borderless', 'underlined', 'menu', 'sheet'],
        description:
          "Input visual variant. On mobile, 'menu' draws an iOS Settings-style row, the title at the left and the chosen option at the right, that opens a native menu of the options. 'sheet' draws the same row, opening a bottom sheet of the options with their avatar pictures, descriptions, a pinned group and a search field for a long list.",
      },
    },
  },
};
