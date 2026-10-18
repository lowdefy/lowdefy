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
  icons: [],
  valueType: 'any',
  cssKeys: {
    element: 'The Selector box.',
    label: 'The Selector label.',
    extra: 'The Selector extra content.',
    feedback: 'The Selector validation feedback.',
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
                  description: 'Leave the option out of the picker.',
                },
                filterString: { type: 'string', description: 'Ignored on mobile.' },
                style: { type: 'object', description: 'Ignored on mobile.' },
                tag: { type: 'object', description: 'Ignored on mobile.' },
              },
            },
          },
        ],
      },
      placeholder: { ...placeholder, default: 'Select item' },
      showSearch: {
        type: 'boolean',
        default: true,
        description: 'Ignored on mobile.',
      },
      size: sizeSmallDefaultLarge,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      variant: {
        ...variant,
        enum: ['solid', 'outlined', 'filled', 'borderless', 'underlined'],
      },
    },
  },
};
