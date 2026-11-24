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

// `String(number)` uses exponential notation for very small or very large numbers.
const plainNumberFormat = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  useGrouping: false,
  maximumSignificantDigits: 21,
});

// The text antd's Statistic draws for a value (antd's StatisticNumber, with no formatter): a
// number-like value with its integer grouped and its decimals cut or padded to precision, any
// other value as it reads as a string.
function formatStatisticValue({ value, precision, decimalSeparator = '.', groupSeparator = ',' }) {
  const rawValue = String(value);
  const text =
    type.isNumber(value) && rawValue.includes('e') ? plainNumberFormat.format(value) : rawValue;
  const cells = text.match(/^(-?)(\d*)(\.(\d+))?$/);
  if (cells === null || text === '-') {
    return text;
  }
  const negative = cells[1];
  const int = (cells[2] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  let decimal = cells[4] || '';
  if (type.isNumber(precision)) {
    decimal = decimal.padEnd(precision, '0').slice(0, precision > 0 ? precision : 0);
  }
  return `${negative}${int}${decimal === '' ? '' : `${decimalSeparator}${decimal}`}`;
}

export default formatStatisticValue;
