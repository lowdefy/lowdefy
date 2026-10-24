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
  sizeSmallMiddleLarge,
  theme,
  variant,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: ['ArrowUp'],
  valueType: 'string',
  cssKeys: {
    element: 'The TextArea box (the composer field with `variant: composer`).',
    label: 'The TextArea label.',
    extra: 'The TextArea extra content.',
    feedback: 'The TextArea validation feedback.',
  },
  events: {
    onBlur: 'Trigger actions when the text area loses focus.',
    onChange: {
      description: 'Trigger actions when the text area is changed.',
      event: { value: 'The current input value.' },
    },
    onClear: 'Trigger actions when the clear button is pressed.',
    onFocus: 'Trigger actions when the text area gets focus.',
    onPressEnter:
      'Never fires on mobile: the return key adds a new line, as it does in a web text area.',
    onSend: {
      description:
        'Mobile only. With `variant: composer`, the block shows a send button that triggers these actions with the text; the field clears when they succeed.',
      event: { value: 'The text sent.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: { ...allowClear, default: false },
      autoFocus,
      autoSize: {
        type: ['boolean', 'object'],
        description:
          'On mobile the text area always grows with its text, from the height of `rows` lines.',
      },
      bordered,
      disabled,
      label,
      maxLength: {
        type: 'integer',
        description: 'The max number of input characters.',
      },
      placeholder,
      rows: {
        type: 'integer',
        description: 'Number of lines the text area shows when empty.',
      },
      showCount: {
        type: ['boolean', 'object'],
        default: false,
        description: 'Show the character count beneath the text area.',
      },
      size: sizeSmallMiddleLarge,
      theme,
      title: inputTitle,
      variant: {
        ...variant,
        enum: [...variant.enum, 'composer'],
        description: `${variant.description} \`composer\` (mobile only) is a message composer: a rounded field that grows from one line to six, with a send button when the block has onSend.`,
      },
    },
  },
};
