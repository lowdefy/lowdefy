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

const URL_REGEX = /^https?:\/\/\S+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})/;
const MAX_DEPTH = 3;
const MAX_ITEMS = 20;

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatPrimitive({ value, translate }) {
  if (type.isNone(value)) return { kind: 'empty', text: '—' };
  if (type.isBoolean(value)) return { kind: 'text', text: value ? 'Yes' : 'No' };
  if (type.isNumber(value)) return { kind: 'text', text: value.toLocaleString() };
  if (type.isString(value) && URL_REGEX.test(value)) return { kind: 'link', text: value };
  if (type.isString(value) && ISO_DATE_REGEX.test(value) && !Number.isNaN(Date.parse(value))) {
    return { kind: 'text', text: new Date(value).toLocaleString() };
  }
  if (type.isString(value)) {
    return value === ''
      ? { kind: 'empty', text: translate('agent.toolResult.empty') }
      : { kind: 'text', text: value };
  }
  return { kind: 'text', text: String(value) };
}

function isPrimitive(value) {
  return type.isNone(value) || (!type.isArray(value) && !type.isObject(value));
}

function pushValue({ depth, label, rows, translate, value }) {
  if (isPrimitive(value)) {
    rows.push({ depth, label, ...formatPrimitive({ value, translate }) });
    return;
  }
  const entries = type.isArray(value)
    ? value.map((item, index) => [String(index + 1), item])
    : Object.entries(value).map(([key, item]) => [humanizeKey(key), item]);
  if (entries.length === 0) {
    const key = type.isArray(value) ? 'agent.toolResult.emptyList' : 'agent.toolResult.empty';
    rows.push({ depth, label, kind: 'empty', text: translate(key) });
    return;
  }
  if (depth >= MAX_DEPTH) {
    rows.push({ depth, label, kind: 'text', text: JSON.stringify(value) });
    return;
  }
  if (!type.isNone(label)) {
    rows.push({ depth, label, kind: 'group' });
  }
  const childDepth = type.isNone(label) ? depth : depth + 1;
  entries.slice(0, MAX_ITEMS).forEach(([childLabel, item]) => {
    pushValue({ depth: childDepth, label: childLabel, rows, translate, value: item });
  });
  if (entries.length > MAX_ITEMS) {
    rows.push({ depth: childDepth, kind: 'more', text: `+${entries.length - MAX_ITEMS}` });
  }
}

/**
 * A tool's output as rows a person reads, the native form of the web block's formatToolResult:
 * each field a labelled row (keys humanised, "Yes"/"No", numbers and dates in the locale, links,
 * "—" for nothing), nested objects and lists as indented groups, at most 20 entries a level and 3
 * levels deep.
 *
 * @param {Object} params
 * @param {*} params.output
 * @param {Function} params.translate
 * @returns {{ depth: number, kind: 'text'|'link'|'empty'|'group'|'more', label?: string,
 *   text?: string }[]}
 */
function getReadableRows({ output, translate }) {
  if (type.isNone(output)) {
    return [{ depth: 0, kind: 'empty', text: translate('agent.toolResult.completedNoData') }];
  }
  const rows = [];
  pushValue({ depth: 0, label: null, rows, translate, value: output });
  return rows;
}

export default getReadableRows;
