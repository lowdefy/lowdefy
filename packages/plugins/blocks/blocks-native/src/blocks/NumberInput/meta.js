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
  autoFocus,
  bordered,
  disabled,
  inputTitle,
  placeholder,
  prefix,
  sizeSmallDefaultLarge,
  suffix,
  theme,
  variant,
  webIcon,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [],
  valueType: 'number',
  cssKeys: {
    element: 'The NumberInput box.',
    label: 'The NumberInput label.',
    extra: 'The NumberInput extra content.',
    feedback: 'The NumberInput validation feedback.',
  },
  events: {
    onBlur: 'Trigger actions when the number input loses focus.',
    onChange: {
      description: 'Trigger actions when the number changes.',
      event: { value: 'The current number, or null when the input is empty.' },
    },
    onFocus: 'Trigger actions when the number input gets focus.',
    onPressEnter: "Trigger actions when the keyboard's return key is pressed.",
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus,
      bordered,
      changeOnWheel: {
        type: 'boolean',
        default: false,
        description: 'Ignored on mobile.',
      },
      controls: {
        type: 'boolean',
        default: true,
        description: "Ignored on mobile: use mode: 'spinner' for step buttons.",
      },
      decimalSeparator: {
        type: 'string',
        description: 'Separator between the whole number and its decimals.',
      },
      disabled,
      formatter: {
        type: 'object',
        description: 'Ignored on mobile.',
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Ignored on mobile.',
      },
      label,
      max: {
        type: 'number',
        description:
          'The maximum value. A larger number is lowered to it when the input loses focus.',
      },
      min: {
        type: 'number',
        description:
          'The minimum value. A smaller number is raised to it when the input loses focus. Without a negative minimum the keyboard has no minus key.',
      },
      mode: {
        type: 'string',
        enum: ['input', 'spinner'],
        default: 'input',
        description: "'spinner' shows step buttons either side of the number.",
      },
      parser: {
        type: 'object',
        description: 'Ignored on mobile.',
      },
      placeholder,
      precision: {
        type: 'integer',
        description: 'The number of decimals the value is rounded to when the input loses focus.',
      },
      prefix,
      prefixIcon: webIcon,
      size: sizeSmallDefaultLarge,
      step: {
        type: 'number',
        default: 1,
        description: 'The amount a step button changes the value by.',
      },
      suffix,
      suffixIcon: webIcon,
      theme,
      title: inputTitle,
      variant,
    },
  },
};
