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

// Properties shared by the dropdown selectors built on antd Select and TreeSelect (Selector,
// MultipleSelector, TreeSelector, TreeMultipleSelector, AutoComplete), so they stay consistent.

export const listHeight = {
  type: 'number',
  default: 256,
  description: 'Height of the dropdown list in pixels.',
};

export const maxCount = {
  type: 'number',
  description:
    'Maximum number of options that can be selected. Once reached, the remaining options are disabled.',
};

export const maxTagCount = {
  type: ['number', 'string'],
  description:
    "Maximum number of selected tags shown before the rest collapse into a count. Set to 'responsive' to fit as many tags as the input width allows.",
  oneOf: [{ type: 'number' }, { type: 'string', enum: ['responsive'] }],
};

export const placement = {
  type: 'string',
  enum: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
  default: 'bottomLeft',
  description: 'Position of the dropdown relative to the selector.',
};

export const popupMatchSelectWidth = {
  type: ['boolean', 'number'],
  default: true,
  description:
    'Make the dropdown the same width as the selector. Set a number of pixels for a fixed dropdown width, or false to size the dropdown to its options (this also turns off virtual scrolling).',
};

export const prefix = {
  type: 'string',
  description: 'Text shown inside the selector before the selected value.',
};

export const prefixIcon = {
  ...icon,
  description:
    'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to show inside the selector before the selected value. Ignored when `prefix` is set.',
};

export const virtual = {
  type: 'boolean',
  default: true,
  description:
    'Only render the dropdown options in view. Set to false when options have very different heights, or so screen readers can reach every option.',
};
