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

import formatDate from '@lowdefy/block-utils/format/formatDate.js';
import formatNumber from '@lowdefy/block-utils/format/formatNumber.js';
import { get, type } from '@lowdefy/helpers';

import DATE_FORMATS from './dateFormats.js';
import getNumberConfig from './getNumberConfig.js';
import getPerson from './getPerson.js';
import getRelationLabel from './getRelationLabel.js';
import htmlToText from './htmlToText.js';
import isEmptyValue from './isEmptyValue.js';
import resolveOption from './resolveOption.js';

function plainText(value) {
  if (isEmptyValue(value)) return '';
  if (type.isArray(value)) return value.map(plainText).join(', ');
  if (type.isObject(value)) return JSON.stringify(value);
  if (type.isDate(value)) return value.toISOString();
  return String(value);
}

function optionLabels({ value, column }) {
  const items = type.isArray(value) ? value : [value];
  return items
    .filter((item) => !isEmptyValue(item))
    .map(
      (item) => resolveOption({ options: column.options, value: item })?.label ?? plainText(item)
    )
    .join(', ');
}

// The text a cell shows, as a plain string: the display format of the
// column's type without the markup. Used for CSV export, ellipsis tooltips and
// anywhere a cell has to be read as text.
function getCellText({ column, value, row }) {
  const { cell } = column;
  switch (column.type) {
    case 'number':
    case 'currency':
    case 'percent': {
      if (isEmptyValue(value)) return '';
      const n = Number(value);
      if (Number.isNaN(n)) return '';
      return formatNumber({ value: n, config: getNumberConfig({ column }) });
    }
    case 'progress': {
      if (isEmptyValue(value)) return '';
      return `${Number(value)}${cell.suffix ?? '%'}`;
    }
    case 'rating':
      return isEmptyValue(value) ? '' : String(Number(value));
    case 'date':
    case 'datetime':
      if (isEmptyValue(value)) return '';
      return (
        formatDate({
          value,
          format: cell.format ?? DATE_FORMATS[column.type],
          relative: cell.relative,
        }) ?? ''
      );
    case 'boolean':
      if (type.isNone(value)) return '';
      return value ? cell.trueLabel ?? 'Yes' : cell.falseLabel ?? 'No';
    case 'tag':
    case 'tags':
    case 'status':
      return optionLabels({ value, column });
    case 'avatar': {
      const name = type.isString(cell.nameField) ? get(row, cell.nameField) : value;
      return plainText(name);
    }
    case 'people':
      return (type.isArray(value) ? value : [value])
        .map((item) => getPerson({ item, cell }).name)
        .filter((name) => !isEmptyValue(name))
        .join(', ');
    case 'link': {
      if (isEmptyValue(value)) return '';
      const label = type.isString(cell.labelField) ? get(row, cell.labelField) : undefined;
      return plainText(label ?? value);
    }
    case 'relation':
      return (type.isArray(value) ? value : [value])
        .filter((item) => !isEmptyValue(item))
        .map((item) => getRelationLabel({ item, cell }))
        .join(', ');
    case 'html':
      // Columns are compiled (compileColumns) before any text is read from them.
      if (type.isFunction(column.compiled?.template)) {
        return htmlToText(column.compiled.template({ value, row }));
      }
      return htmlToText(plainText(value));
    case 'json':
      return type.isUndefined(value) ? '' : JSON.stringify(value);
    case 'buttons':
    case 'menu':
      return '';
    default:
      return plainText(value);
  }
}

export default getCellText;
