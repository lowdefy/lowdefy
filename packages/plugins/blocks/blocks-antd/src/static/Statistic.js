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

import { isBlank } from './utils.js';

/**
 * Format the value exactly as antd's Statistic does so the PDF matches the
 * page: group the integer part, pad/truncate decimals to `precision`
 * (truncation, not rounding — antd's default formatter slices), then wrap in
 * `prefix`/`suffix`. A non-numeric value passes through unformatted.
 */
function formatValue({
  value,
  precision,
  groupSeparator = ',',
  decimalSeparator = '.',
  prefix,
  suffix,
}) {
  let body = '';
  if (!type.isNone(value)) {
    const raw = String(value);
    const cells = raw.match(/^(-?)(\d*)(\.(\d+))?$/);
    if (!cells || raw === '-') {
      body = raw;
    } else {
      const negative = cells[1];
      let int = cells[2] || '0';
      let decimal = cells[4] || '';
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
      if (type.isNumber(precision)) {
        decimal = decimal.padEnd(precision, '0').slice(0, precision);
      }
      if (decimal) decimal = `${decimalSeparator}${decimal}`;
      body = `${negative}${int}${decimal}`;
    }
  }
  const pre = isBlank(prefix) ? '' : String(prefix);
  const suf = isBlank(suffix) ? '' : String(suffix);
  return `${pre}${body}${suf}`;
}

/** Statistic → `stat`: `title` label and the antd-formatted display value. */
export const Statistic = {
  toReport: ({ block }) => {
    const { title } = block.properties;
    return {
      kind: 'stat',
      label: isBlank(title) ? '' : String(title),
      value: formatValue(block.properties),
    };
  },
};
