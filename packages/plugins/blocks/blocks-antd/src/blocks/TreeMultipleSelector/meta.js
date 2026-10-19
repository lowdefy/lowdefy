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
import {
  listHeight,
  maxCount,
  maxTagCount,
  placement,
  popupMatchSelectWidth,
  prefix,
  prefixIcon,
  virtual,
} from '../../schemas/selectProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'chevron-down', 'clear', 'close', 'loading'],
  valueType: 'array',
  cssKeys: {
    element: 'The TreeMultipleSelector element.',
    label: 'The TreeMultipleSelector label.',
    extra: 'The TreeMultipleSelector extra content.',
    feedback: 'The TreeMultipleSelector validation feedback.',
    suffixIcon: 'The suffix icon in the TreeMultipleSelector.',
    clearIcon: 'The clear icon in the TreeMultipleSelector.',
    popup: 'The TreeMultipleSelector dropdown popup.',
    prefixIcon: 'The prefix icon in the TreeMultipleSelector.',
    removeIcon: 'The remove icon on each selected tag in the TreeMultipleSelector.',
    selector:
      'The inner value/tag container of the TreeMultipleSelector (antd `content` semantic slot).',
  },
  events: {
    onBlur: 'Trigger action when the selector loses focus.',
    onChange: {
      description: 'Trigger action when selection is changed.',
      event: { value: 'The selected values (array).' },
    },
    onFocus: 'Trigger action when the selector gains focus.',
    onClear: 'Trigger action when the selector is cleared.',
    onOpenChange: {
      description: 'Trigger actions when the dropdown opens or closes.',
      event: { open: 'Whether the dropdown is open.' },
    },
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
      listHeight,
      placement,
      popupMatchSelectWidth,
      prefix,
      prefixIcon,
      virtual,
      placeholder: { ...placeholder, default: 'Select items' },
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
      treeExpandAction: {
        type: 'string',
        enum: ['click', 'doubleClick'],
        description:
          'Expand or collapse a node by clicking or double-clicking its title. When not set, nodes only expand with the switcher.',
      },
      treeLine: {
        type: 'boolean',
        default: false,
        description: 'Show connecting lines between tree nodes.',
      },
      autoClearSearchValue: {
        type: 'boolean',
        default: true,
        description: 'Whether the current search will be cleared on selecting an item.',
      },
      checkable: {
        type: 'boolean',
        default: false,
        description: 'Show checkboxes on the tree nodes instead of selectable tags.',
      },
      checkStrictly: {
        type: 'boolean',
        default: false,
        description:
          'When `checkable` is true, check nodes independently: checking a parent does not check its children, and checking every child does not check the parent.',
      },
      showCheckedStrategy: {
        type: 'string',
        enum: ['SHOW_ALL', 'SHOW_PARENT', 'SHOW_CHILD'],
        default: 'SHOW_CHILD',
        description:
          'How checked nodes are shown when `checkable` is true: SHOW_ALL (all checked), SHOW_PARENT (parent only), SHOW_CHILD (leaf children only).',
      },
      maxCount,
      maxTagCount,
      notFoundContent: {
        type: 'string',
        default: 'Not found',
        description: 'Content shown when no nodes match the search.',
      },
      suffixIcon: { ...icon, default: 'chevron-down', description: 'Dropdown suffix icon.' },
      clearIcon: { ...icon, default: 'clear', description: 'Clear icon.' },
      removeIcon: {
        ...icon,
        default: 'close',
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize the remove icon on each selected tag.',
      },
      theme: treeSelectTheme,
    },
  },
};
