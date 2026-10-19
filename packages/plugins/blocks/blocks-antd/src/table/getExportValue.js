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

import getCellText from './getCellText.js';
import getRelationLabel from './getRelationLabel.js';
import getPerson from './getPerson.js';
import isEmptyValue from './isEmptyValue.js';

function rawValue({ column, value }) {
  const { cell } = column;
  if (isEmptyValue(value)) return '';
  if (type.isDate(value)) return value.toISOString();
  if (type.isArray(value)) {
    return value
      .map((item) => {
        if (column.type === 'people') return getPerson({ item, cell }).name;
        if (column.type === 'relation') return getRelationLabel({ item, cell });
        return type.isObject(item) ? JSON.stringify(item) : item;
      })
      .filter((item) => !isEmptyValue(item))
      .join(', ');
  }
  if (type.isObject(value)) {
    if (column.type === 'relation') return getRelationLabel({ item: value, cell });
    return JSON.stringify(value);
  }
  return value;
}

// A cell's CSV value. `formatted: true` gives the text the cell shows (option
// labels, formatted numbers and dates, HTML stripped); otherwise the raw value,
// with numbers and booleans kept as they are, dates as ISO strings, lists
// joined with ", " and records as JSON (people and relations by their names).
// Action columns (buttons, menu) export as an empty string; hosts usually
// leave them out of the export.
function getExportValue({ column, value, row, formatted }) {
  if (column.type === 'buttons' || column.type === 'menu') return '';
  if (formatted === true) return getCellText({ column, value, row });
  return rawValue({ column, value });
}

export default getExportValue;
