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

import formatBytes from '../format/formatBytes.js';
import formatNumber from '../format/formatNumber.js';
import replaceText from './replaceText.js';

const FORMATS = new Set(['number', 'currency', 'percent', 'compact', 'bytes']);
// Decimal text only: "0x1A", "Infinity" and "1,234" are not numbers here.
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
const CURRENCY = /^[A-Za-z]{3}$/;
const DECIMALS = /^([0-9]|1[0-9]|20)$/;

function readDecimals(element) {
  const decimals = element.getAttribute('data-decimals');
  if (decimals === null) return undefined;
  if (!DECIMALS.test(decimals)) {
    console.warn(
      `data-decimals="${decimals}" is not a whole number from 0 to 20, so it was ignored.`
    );
    return undefined;
  }
  return Number(decimals);
}

function formatValue({ element, locale, value }) {
  const format = element.getAttribute('data-format') || 'number';
  if (!FORMATS.has(format)) {
    console.warn(`data-format="${format}" is not a number format, so the text was left as it is.`);
    return null;
  }
  const decimals = readDecimals(element);
  if (format === 'bytes') {
    return formatBytes({ value, decimals, locale });
  }
  const config = { format, decimals, locale };
  if (format === 'currency') {
    const currency = element.getAttribute('data-currency') ?? '';
    if (!CURRENCY.test(currency)) {
      console.warn(
        `data-format="currency" needs data-currency with a three-letter currency code, so "${value}" was left as it is.`
      );
      return null;
    }
    config.currency = currency.toUpperCase();
  }
  return formatNumber({ value, config });
}

// data-format renders the element's number as number, currency, percent,
// compact or bytes, with the grid's number formatting, in the app's locale.
const formatEnhancer = {
  name: 'format',
  attributes: ['data-format'],
  prepare({ registration, select }) {
    const elements = select('[data-format]');
    if (elements.length === 0) return;
    const locale = registration.getLocale();
    elements.forEach((element) => {
      const text = element.textContent.trim();
      if (!DECIMAL.test(text)) {
        if (text !== '') {
          console.warn(
            `data-format could not read "${text}" as a number, so it was left as it is.`
          );
        }
        return;
      }
      const formatted = formatValue({ element, locale, value: Number(text) });
      if (formatted !== null) {
        replaceText(element, formatted);
      }
    });
  },
};

export default formatEnhancer;
