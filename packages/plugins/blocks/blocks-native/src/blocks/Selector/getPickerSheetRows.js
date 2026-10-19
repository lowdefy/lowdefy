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
import getOptionValue from './getOptionValue.js';
import normalizeSearchText from './normalizeSearchText.js';

// The row keys of the item that stands for no value and of the row that adds the search text.
const NO_VALUE_KEY = 'no_value';
const CREATE_KEY = 'create';

function getOptionRow({ full, index, option, selected }) {
  const isObject = type.isObject(option);
  const chosen = selected.includes(index);
  return {
    create: false,
    description: isObject && type.isString(option.description) ? option.description : null,
    disabled: (isObject && option.disabled === true) || (full && !chosen),
    index,
    invalid: false,
    key: `${index}`,
    label: getOptionLabel({ option }),
    noValue: false,
    option: isObject ? option : null,
    pinned: isObject && option.pinned === true,
    selected: chosen,
  };
}

// The row that adds the search text as a new value, while it is not an option's label or value.
// Text the pattern refuses gives a row that cannot be picked, with the pattern's message under it.
function getCreateRow({ create, full, options, query }) {
  const text = query.trim();
  if (create === null || text === '') return null;
  const search = normalizeSearchText({ text });
  const exists = options.some(
    (option) =>
      normalizeSearchText({ text: getOptionLabel({ option }) }) === search ||
      normalizeSearchText({ text: `${getOptionValue({ option })}` }) === search
  );
  if (exists) return null;
  const valid = !type.isString(create.pattern) || new RegExp(create.pattern).test(text);
  return {
    create: true,
    description: valid ? null : create.message ?? null,
    disabled: !valid || full,
    index: null,
    invalid: !valid,
    key: CREATE_KEY,
    label: `Add “${text}”`,
    noValue: false,
    option: null,
    pinned: true,
    selected: false,
    value: text,
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

// The rows of the options in `first`, then the others, each in option order.
function sortFirst({ first, rows }) {
  return [
    ...rows.filter((row) => first.includes(row.index)),
    ...rows.filter((row) => !first.includes(row.index)),
  ];
}

/**
 * The rows of a picker sheet (Selector and MultipleSelector `variant: sheet`), in order: a
 * pinned group (the row that adds the search text as a new value, the item that stands for no
 * value, then the options with `pinned: true`), then the other options. Within each group the
 * options in `first` lead. With a search query, only the rows whose label holds it, ignoring
 * case and diacritics. A disabled option is kept, to be drawn dimmed, as the menu variant shows
 * it.
 *
 * @param {Object} params
 * @param {{ pattern?: string, message?: string }|null} [params.create] Offer to add the search
 *   text as a new value, checked against the `pattern` regex.
 * @param {number[]} [params.first] Indices of the options listed first in their group.
 * @param {boolean} [params.full] No more options can be chosen, so the unchosen options and the
 *   add row are disabled.
 * @param {boolean} [params.noValue] List the item that stands for no value.
 * @param {Array} params.options
 * @param {string} [params.placeholder] The label of the item that stands for no value.
 * @param {string} [params.query] The search text.
 * @param {number[]} [params.selected] Indices of the chosen options. The no-value item is chosen
 *   while it is empty.
 * @returns {Object[]} `{ key, index, label, description, option, noValue, create, value,
 *   invalid, pinned, selected, disabled, separator }`; index is null for the no-value and add
 *   rows; value is the add row's text; separator is 'inset', 'group' or 'none'.
 */
function getPickerSheetRows({
  create = null,
  first = [],
  full = false,
  noValue = false,
  options,
  placeholder,
  query = '',
  selected = [],
}) {
  const search = normalizeSearchText({ text: query });
  const matches = (row) => normalizeSearchText({ text: row.label }).includes(search);
  const optionRows = sortFirst({
    first,
    rows: options
      .map((option, index) => getOptionRow({ full, index, option, selected }))
      .filter(matches),
  });
  const pinned = optionRows.filter((row) => row.pinned);
  const rest = optionRows.filter((row) => !row.pinned);
  const noValueRow = {
    create: false,
    description: null,
    disabled: false,
    index: null,
    invalid: false,
    key: NO_VALUE_KEY,
    label: placeholder,
    noValue: true,
    option: null,
    pinned: true,
    selected: selected.length === 0,
  };
  if (noValue && matches(noValueRow)) {
    pinned.unshift(noValueRow);
  }
  const createRow = getCreateRow({ create, full, options, query });
  if (createRow !== null) {
    pinned.unshift(createRow);
  }
  return withSeparators({ pinned, rest });
}

export { CREATE_KEY, NO_VALUE_KEY };
export default getPickerSheetRows;
