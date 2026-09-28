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

// Integration point: this file will re-export `getExportValue` from
// `@lowdefy/blocks-antd/table/getExportValue.js` once the shared column core lands (typed display
// formats per cell type). Until then `formatted` exports the same text the local cells render.

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const NUMERIC_TYPES = new Set(['number', 'currency', 'percent', 'progress', 'rating']);

function getExportValue({ column, value, formatted }) {
  if (type.isNone(value)) return '';
  if (type.isDate(value)) return value.toISOString();
  if (type.isArray(value)) {
    return value.map((item) => getExportValue({ column, value: item, formatted })).join(', ');
  }
  if (type.isObject(value)) return JSON.stringify(value);
  if (formatted && NUMERIC_TYPES.has(column.type) && type.isNumber(value)) {
    return numberFormat.format(value);
  }
  return String(value);
}

export default getExportValue;
