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

import fromDateValue from './fromDateValue.js';

// Rounds away the float noise of x100 (0.07 * 100 = 7.000000000000001).
function scalePercent(value) {
  return Math.round(value * 100 * 1e8) / 1e8;
}

// The editor's starting value for a cell value. A printable key that opened the editor seeds text
// and number editors (a digit replaces the number); percents edit as the number shown (12 for
// 0.12) and dates as the picker's dayjs.
function toEditorDraft({ spec, value, seed }) {
  switch (spec.kind) {
    case 'text':
      if (type.isString(seed)) return seed;
      return type.isNone(value) ? '' : String(value);
    case 'number': {
      if (type.isString(seed) && /^\d$/.test(seed)) return Number(seed);
      if (type.isNone(value) || value === '' || Number.isNaN(Number(value))) return null;
      return spec.type === 'percent' ? scalePercent(Number(value)) : Number(value);
    }
    case 'date':
    case 'datetime':
      return fromDateValue({ value, kind: spec.kind });
    case 'boolean':
      return value === true;
    case 'select':
      return type.isNone(value) || value === '' ? undefined : value;
    case 'multiSelect':
      if (type.isArray(value)) return value;
      return type.isNone(value) || value === '' ? [] : [value];
    case 'rating':
      return type.isNone(value) ? 0 : Number(value);
    default:
      return value;
  }
}

export default toEditorDraft;
