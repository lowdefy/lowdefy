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

import { type } from '@lowdefy/helpers';

import getOptionLabel from './getOptionLabel.js';
import normalizeSearchText from './normalizeSearchText.js';

// The row key of the item that stands for no value.
const NO_VALUE_KEY = 'no_value';

function getOptionRow({ index, option, selectedIndex }) {
  const isObject = type.isObject(option);
  return {
    description: isObject && type.isString(option.description) ? option.description : null,
    disabled: isObject && option.disabled === true,
    index,
    key: `${index}`,
    label: getOptionLabel({ option }),
    noValue: false,
    option: isObject ? option : null,
    pinned: isObject && option.pinned === true,
    selected: index === selectedIndex,
  };
}

// The separator under each row: inset to the label within a group, the width of the sheet
// under the pinned group's last row while other rows follow, and none under the last row.
function withSeparators({ pinned, rest }) {
  const rows = [...pinned, ...rest];
  return rows.map((row, position) => {
    let separator = 'inset';
    if (position === rows.length - 1) {
      separator = 'none';
    } else if (position === pinned.length - 1) {
      separator = 'group';
    }
    return { ...row, separator };
  });
}

/**
 * The rows of a Selector picker sheet, in order: a pinned group (the item that stands for no
 * value, while there is no value or the value can be cleared, then the options with
 * `pinned: true`), then the other options. With a search query, only the rows whose label holds
 * it, ignoring case and diacritics. A disabled option is kept, to be drawn dimmed, as the menu
 * variant shows it.
 *
 * @param {Object} params
 * @param {boolean} params.allowClear
 * @param {Array} params.options
 * @param {string} params.placeholder The label of the item that stands for no value.
 * @param {string} [params.query] The search text.
 * @param {number|null} params.selectedIndex
 * @returns {Object[]} `{ key, index, label, description, option, noValue, pinned, selected,
 *   disabled, separator }`; index is null for the no-value row; separator is 'inset', 'group'
 *   or 'none'.
 */
function getPickerSheetRows({ allowClear, options, placeholder, query = '', selectedIndex }) {
  const search = normalizeSearchText({ text: query });
  const matches = (row) => normalizeSearchText({ text: row.label }).includes(search);
  const optionRows = options
    .map((option, index) => getOptionRow({ index, option, selectedIndex }))
    .filter(matches);
  const pinned = optionRows.filter((row) => row.pinned);
  const rest = optionRows.filter((row) => !row.pinned);
  const noValueRow = {
    description: null,
    disabled: false,
    index: null,
    key: NO_VALUE_KEY,
    label: placeholder,
    noValue: true,
    option: null,
    pinned: true,
    selected: selectedIndex === null,
  };
  if ((selectedIndex === null || allowClear) && matches(noValueRow)) {
    pinned.unshift(noValueRow);
  }
  return withSeparators({ pinned, rest });
}

export { NO_VALUE_KEY };
export default getPickerSheetRows;
