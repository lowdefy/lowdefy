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

import numberFormatOptions from './numberFormatOptions.js';

// Formats a number with the shared config: Intl options, then a hyphen or
// parentheses for negatives, then an optional prefix and suffix.
function formatNumber({ value, config }) {
  const opts = numberFormatOptions(config);
  const absText = new Intl.NumberFormat(config?.locale, opts).format(Math.abs(value));

  let text;
  if (value < 0) {
    text = config?.negative === 'parentheses' ? `(${absText})` : `-${absText}`;
  } else {
    text = absText;
  }

  const prefix = config?.prefix ?? '';
  const suffix = config?.suffix ?? '';
  return `${prefix}${text}${suffix}`;
}

export default formatNumber;
