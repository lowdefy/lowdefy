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

// Intl.NumberFormat options from the number-formatting config the grid's number
// cells and data-format share.
function numberFormatOptions(config = {}) {
  const {
    format = 'number',
    decimals,
    minDecimals,
    maxDecimals,
    currency = 'USD',
    currencyDisplay = 'symbol',
    notation,
    useGrouping = true,
  } = config;

  const opts = { useGrouping };

  if (format === 'currency') {
    opts.style = 'currency';
    opts.currency = currency;
    opts.currencyDisplay = currencyDisplay;
  } else if (format === 'percent') {
    opts.style = 'percent';
  } else if (format === 'compact') {
    opts.notation = 'compact';
    opts.compactDisplay = 'short';
  } else {
    opts.style = 'decimal';
  }

  if (notation && !opts.notation) opts.notation = notation;

  if (type.isInt(decimals)) {
    opts.minimumFractionDigits = decimals;
    opts.maximumFractionDigits = decimals;
  } else {
    if (type.isInt(minDecimals)) opts.minimumFractionDigits = minDecimals;
    if (type.isInt(maxDecimals)) opts.maximumFractionDigits = maxDecimals;
  }

  return opts;
}

export default numberFormatOptions;
