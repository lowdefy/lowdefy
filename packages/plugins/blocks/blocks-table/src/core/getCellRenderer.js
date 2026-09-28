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

// Integration point: this file will re-export `getCellRenderer` from
// `@lowdefy/blocks-antd/table/getCellRenderer.js` once the shared cell catalogue lands. Until then
// every type renders as plain text, which is the tier-0 cost the engine is benchmarked against.
// Renderer contract: CellRenderer({ value, row, rowKey, column, methods, components, onEvent }).

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const NUMERIC_TYPES = new Set(['number', 'currency', 'percent', 'progress', 'rating']);

function toText({ value, column }) {
  if (type.isNone(value) || value === '') return '';
  if (NUMERIC_TYPES.has(column.type) && type.isNumber(value)) return numberFormat.format(value);
  if (type.isDate(value)) return value.toISOString();
  if (type.isArray(value)) return value.map((item) => toText({ value: item, column })).join(', ');
  if (type.isObject(value)) return JSON.stringify(value);
  return String(value);
}

function TextCell({ value, column }) {
  return toText({ value, column });
}

function getCellRenderer() {
  return TextCell;
}

export default getCellRenderer;
