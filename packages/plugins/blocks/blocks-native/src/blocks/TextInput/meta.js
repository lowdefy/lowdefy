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
  prefix,
  sizeSmallMiddleLarge,
  suffix,
  theme,
  variant,
  webIcon,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: ['search'],
  valueType: 'string',
  cssKeys: {
    element:
      'The TextInput box (the search field with `variant: search`, the row with `variant: row`).',
    label: 'The TextInput label (the row title with `variant: row`).',
    extra: 'The TextInput extra content.',
    feedback: 'The TextInput validation feedback.',
    value: 'The text and its prefix and suffix with `variant: row`.',
  },
  events: {
    onBlur: 'Trigger actions when the text input loses focus.',
    onChange: {
      description: 'Trigger actions when the text input is changed.',
      event: { value: 'The current input value.' },
    },
    onClear:
      'Trigger actions when the clear button is pressed, or Cancel beside a search field clears it.',
    onFocus: 'Trigger actions when the text input gets focus.',
    onPressEnter:
      "Trigger actions when the keyboard's return key is pressed (the Search key of a search field).",
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: false },
      autoFocus,
      bordered,
      disabled,
      label,
      maxLength: {
        type: 'integer',
        description: 'The max number of input characters.',
      },
      placeholder,
      prefix,
      prefixIcon: webIcon,
      replaceInput: {
        type: 'object',
        description: 'Regex used to sanitize input.',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regular expression pattern to use to sanitize input.',
          },
          flags: {
            type: 'string',
            description: "The regex flags to use. The default value is 'gm'.",
          },
          replacement: {
            type: 'string',
            description:
              "The string used to replace the input that matches the pattern. The default value is ''.",
          },
        },
      },
      showCount: {
        type: 'boolean',
        default: false,
        description: 'Show the character count.',
      },
      size: sizeSmallMiddleLarge,
      suffix,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      type: {
        type: 'string',
        enum: ['text', 'number', 'password', 'tel', 'email', 'url'],
        default: 'text',
        description:
          'The type of input. On mobile it picks the keyboard: email, phone, URL or numeric keys, or a hidden password entry.',
      },
      variant: {
        ...variant,
        enum: [...variant.enum, 'search', 'row'],
        description: `${variant.description} \`search\` (mobile only) is the iOS search field: a rounded fill with a magnifying glass, a clear button while it has text, the Search key, and Cancel while it is focused. Its placeholder defaults to "Search". \`row\` (mobile only) is an iOS Settings-style row for an insetGrouped List or a Card with \`padding: none\`: the title at the left in Body and the one-line text right-aligned in the secondary label colour (its placeholder defaults to "Not set"), at the height and padding of a Selector menu row. Pressing the row focuses the field; \`allowClear\` shows the clear button while it is focused.`,
      },
    },
  },
};
