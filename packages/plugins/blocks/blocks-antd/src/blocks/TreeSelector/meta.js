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

import LabelMeta from '../Label/meta.js';
import label from '../../schemas/label.js';
import icon from '../../schemas/icon.js';
import options from '../../schemas/options.js';
import treeSelectTheme from '../../schemas/treeSelectTheme.js';
import { data, html, valueKey, primaryKey, parentKey } from '../../schemas/dataOptions.js';
import {
  disabled,
  placeholder,
  inputTitle,
  autoFocus,
  variant,
  bordered,
  allowClear,
  sizeSmallDefaultLarge,
} from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'AiOutlineCloseCircle', 'AiOutlineDown'],
  valueType: 'any',
  cssKeys: {
    element: 'The TreeSelector element.',
    label: 'The TreeSelector label.',
    extra: 'The TreeSelector extra content.',
    feedback: 'The TreeSelector validation feedback.',
    suffixIcon: 'The suffix icon in the TreeSelector.',
    clearIcon: 'The clear icon in the TreeSelector.',
  },
  events: {
    onBlur: 'Trigger action when the selector loses focus.',
    onChange: {
      description: 'Trigger action when selection is changed.',
      event: { value: 'The selected value.' },
    },
    onFocus: 'Trigger action when the selector gains focus.',
    onClear: 'Trigger action when the selector is cleared.',
    onSearch: {
      description: 'Trigger action when the search input changes.',
      event: { value: 'The search input value.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      data,
      html,
      valueKey,
      primaryKey,
      parentKey,
      options,
      label,
      disabled,
      autoFocus,
      allowClear: { ...allowClear, default: true },
      bordered,
      variant,
      size: sizeSmallDefaultLarge,
      title: inputTitle,
      placeholder: { ...placeholder, default: 'Select item' },
      showSearch: {
        type: 'boolean',
        default: true,
        description: 'Make the tree searchable.',
      },
      treeDefaultExpandAll: {
        type: 'boolean',
        default: false,
        description: 'Expand all tree nodes by default.',
      },
      notFoundContent: {
        type: 'string',
        default: 'Not found',
        description: 'Content shown when no nodes match the search.',
      },
      suffixIcon: { ...icon, default: 'AiOutlineDown', description: 'Dropdown suffix icon.' },
      clearIcon: { ...icon, default: 'AiOutlineCloseCircle', description: 'Clear icon.' },
      theme: treeSelectTheme,
    },
  },
};
