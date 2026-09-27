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

import icon from './icon.js';

// Shared by the date selectors, which all render the antd DatePicker, so the five blocks keep the
// same property names, defaults and events.

export const pickerVariant = {
  type: 'string',
  enum: ['outlined', 'filled', 'borderless', 'underlined'],
  default: 'outlined',
  description: "Variant style of the input. Use 'borderless' instead of bordered: false.",
};

export const inputReadOnly = {
  type: 'boolean',
  default: false,
  description:
    'Make the text input read-only, so a date can only be chosen from the calendar. This also stops the on-screen keyboard opening on touch devices.',
};

export const placement = {
  type: 'string',
  enum: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
  default: 'bottomLeft',
  description: 'Position of the calendar popup relative to the input.',
};

export const prefix = {
  type: 'string',
  description: 'Prefix text shown before the date in the input, priority over prefixIcon.',
};

export const prefixIcon = {
  ...icon,
  description:
    'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize icon on the left-hand side of the date picker.',
};

export const showWeek = {
  type: 'boolean',
  default: false,
  description: 'Show the week number of each row in the calendar.',
};

export const pickerEvents = {
  onBlur: 'Trigger actions when the picker loses focus.',
  onClear: 'Trigger actions when the clear button is clicked.',
  onFocus: 'Trigger actions when the picker gets focus.',
  onOpenChange: {
    description: 'Trigger actions when the calendar popup opens or closes.',
    event: { open: 'Whether the popup is open.' },
  },
};
