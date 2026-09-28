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

import formatNumber from '@lowdefy/block-utils/format/formatNumber.js';
import { type } from '@lowdefy/helpers';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import getCellText from './getCellText.js';

const COUNTS = new Set(['count', 'countEmpty', 'countNotEmpty', 'countDistinct']);
const FORMATTED_NUMBER_TYPES = new Set(['number', 'currency', 'percent']);

// The text of a computed aggregate. Counts are plain numbers and percentEmpty
// a percentage; the rest are values of the column and take its format, except
// on progress and rating columns, whose averages would otherwise show every
// decimal.
function getAggregateText({ fn, value, column }) {
  if (type.isNone(value)) return '';
  const locale = column.cell.locale;
  if (COUNTS.has(fn)) return formatNumber({ value, config: { locale } });
  if (fn === 'percentEmpty') {
    return formatNumber({ value, config: { format: 'percent', maxDecimals: 1, locale } });
  }
  if (CELL_TYPE_FAMILIES[column.type] === 'number' && !FORMATTED_NUMBER_TYPES.has(column.type)) {
    const suffix = column.type === 'progress' ? column.cell.suffix ?? '%' : '';
    return `${formatNumber({ value, config: { maxDecimals: 1, locale } })}${suffix}`;
  }
  return getCellText({ column, value, row: {} });
}

export default getAggregateText;
