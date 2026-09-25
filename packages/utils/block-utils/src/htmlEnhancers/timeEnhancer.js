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

import formatDate from '../format/formatDate.js';
import replaceText from './replaceText.js';
import watchRelativeTimes from './watchRelativeTimes.js';

const NAMED_STYLES = {
  date: { dateStyle: 'medium' },
  datetime: { dateStyle: 'medium', timeStyle: 'short' },
  time: { timeStyle: 'short' },
};

// Epoch milliseconds have 12 or more digits, so a year ("2024") or a compact
// date ("20240105") still reaches the date parser.
const EPOCH_MS = /^\d{12,}$/;

function parseValue(raw) {
  return EPOCH_MS.test(raw) ? Number(raw) : raw;
}

function formatNamed({ date, locale, style }) {
  return new Intl.DateTimeFormat(locale, NAMED_STYLES[style]).format(date.toDate());
}

// data-time renders the date in the datetime attribute (or the element's text)
// as relative, date, datetime, time, or a dayjs format string, in the app's
// locale and the browser's time zone. Relative times stay current.
const timeEnhancer = {
  name: 'time',
  attributes: ['data-time'],
  prepare({ registration, select }) {
    const elements = select('[data-time]');
    if (elements.length === 0) return;
    const locale = registration.getLocale();
    const relative = [];
    elements.forEach((element) => {
      const raw = (element.getAttribute('datetime') ?? element.textContent).trim();
      const value = parseValue(raw);
      const date = dayjs(value);
      if (raw === '' || !date.isValid()) {
        console.warn(`data-time could not read "${raw}" as a date, so the text was left as it is.`);
        return;
      }
      const style = element.getAttribute('data-time') || 'datetime';
      if (element.tagName === 'TIME' && !element.hasAttribute('datetime')) {
        element.setAttribute('datetime', date.toISOString());
      }
      if (style === 'relative') {
        const node = replaceText(element, formatDate({ value, relative: true }));
        relative.push({ node, value });
        // A native title or the author's tooltip wins; never show two.
        if (!element.hasAttribute('data-tooltip') && !element.hasAttribute('title')) {
          element.setAttribute('data-tooltip', formatNamed({ date, locale, style: 'datetime' }));
        }
        return;
      }
      if (Object.hasOwn(NAMED_STYLES, style)) {
        replaceText(element, formatNamed({ date, locale, style }));
        return;
      }
      replaceText(element, formatDate({ value, format: style }));
    });
    if (relative.length === 0) return;
    return { cleanup: watchRelativeTimes(relative) };
  },
};

export default timeEnhancer;
