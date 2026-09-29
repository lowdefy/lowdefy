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

import dayjs from 'dayjs';

import matchOption from './matchOption.js';
import toDateValue from './toDateValue.js';

const TRUE_TEXTS = new Set(['true', 'yes', 'y', '1', 'on', 'checked', '✓', '✔']);
const FALSE_TEXTS = new Set(['false', 'no', 'n', '0', 'off', 'unchecked']);

function coerceNumber({ spec, text }) {
  const trimmed = text.trim();
  if (trimmed === '') return { value: null };
  const isPercentText = trimmed.endsWith('%');
  // Copied cells carry their display format: grouping separators, currency symbols, a % sign.
  const cleaned = trimmed.replace(/[\s,_%]/g, '').replace(/^[^\d+\-.]+/, '');
  const number = cleaned === '' ? NaN : Number(cleaned);
  if (Number.isNaN(number)) return { error: `"${text}" is not a number.` };
  if (spec.type === 'percent' && isPercentText) return { value: number / 100 };
  return { value: number };
}

function coerceRating({ spec, text }) {
  const result = coerceNumber({ spec, text });
  if (result.error || result.value === null) return result;
  const rounded = Math.round(result.value);
  if (rounded < 0 || rounded > spec.max) {
    return { error: `"${text}" is not a rating from 0 to ${spec.max}.` };
  }
  return { value: rounded };
}

function coerceDate({ spec, text, previous }) {
  const trimmed = text.trim();
  if (trimmed === '') return { value: null };
  const parsed = dayjs(trimmed);
  if (!parsed.isValid()) return { error: `"${text}" is not a date.` };
  return { value: toDateValue({ date: parsed, kind: spec.kind, previous }) };
}

function coerceBoolean({ text }) {
  const lowered = text.trim().toLowerCase();
  if (lowered === '') return { value: null };
  if (TRUE_TEXTS.has(lowered)) return { value: true };
  if (FALSE_TEXTS.has(lowered)) return { value: false };
  return { error: `"${text}" is not true or false.` };
}

function coerceSelect({ spec, text }) {
  if (text.trim() === '') return { value: null };
  if (!spec.options) return { value: text.trim() };
  const option = matchOption({ options: spec.options, text });
  if (!option) return { error: `"${text}" is not one of the options.` };
  return { value: option.value };
}

function coerceMultiSelect({ spec, text }) {
  const parts = text
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (!spec.options) return { value: parts };
  const values = [];
  for (const part of parts) {
    const option = matchOption({ options: spec.options, text: part });
    if (!option) return { error: `"${part}" is not one of the options.` };
    values.push(option.value);
  }
  return { value: values };
}

// A pasted text as the column's value type. Returns `{ value }`, or `{ error }` with a message
// when the text does not fit the column (a word in a number column, an unknown option).
function coerceCellValue({ spec, text, previous }) {
  const source = String(text ?? '');
  switch (spec.kind) {
    case 'text':
      return { value: source };
    case 'number':
      return coerceNumber({ spec, text: source });
    case 'rating':
      return coerceRating({ spec, text: source });
    case 'date':
    case 'datetime':
      return coerceDate({ spec, text: source, previous });
    case 'boolean':
      return coerceBoolean({ text: source });
    case 'select':
      return coerceSelect({ spec, text: source });
    case 'multiSelect':
      return coerceMultiSelect({ spec, text: source });
    default:
      return { error: 'This column is not editable.' };
  }
}

export default coerceCellValue;
