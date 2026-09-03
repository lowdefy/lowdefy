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

import getErrorBarColor from './getErrorBarColor.js';
import selectBarEntry from './selectBarEntry.js';

test('selectBarEntry returns the newest entry when every entry is the same severity', () => {
  const newest = { type: 'ConfigWarning', message: 'second' };
  expect(selectBarEntry([{ type: 'ConfigWarning', message: 'first' }, newest])).toBe(newest);
});

test('selectBarEntry returns the newest prod-gated warning when the bar is not red', () => {
  // The bar colour says "something here fails in prod"; the message and the
  // badge must belong to that entry, not to the harmless warning after it.
  const prodWarning = { type: 'ConfigWarning', prodError: true, message: 'fails in prod' };
  const entries = [prodWarning, { type: 'ConfigWarning', message: 'harmless' }];

  expect(selectBarEntry(entries)).toBe(prodWarning);
  expect(getErrorBarColor(entries)).toBe('#ad4e00');
});

test('selectBarEntry returns the newest error when an error sits beside a prod-gated warning', () => {
  const error = { type: 'OperatorError', message: 'boom' };
  const entries = [error, { type: 'ConfigWarning', prodError: true }];

  expect(selectBarEntry(entries)).toBe(error);
  expect(getErrorBarColor(entries)).toBe('#cf1322');
});

test('selectBarEntry keeps the newest of a notice and a plain warning, which share a severity', () => {
  const notice = { type: 'TenantNoneNotice', level: 'info' };
  const entries = [{ type: 'ConfigWarning', message: 'w' }, notice];

  expect(selectBarEntry(entries)).toBe(notice);
  expect(getErrorBarColor(entries)).toBe('#d48806');
});

test('selectBarEntry prefers a prod-gated warning over a newer info notice', () => {
  const prodWarning = { type: 'ConfigWarning', prodError: true };
  const entries = [prodWarning, { type: 'TenantNoneNotice', level: 'info' }];

  expect(selectBarEntry(entries)).toBe(prodWarning);
  expect(getErrorBarColor(entries)).toBe('#ad4e00');
});

test('the entry the bar shows and the colour it uses always come from the same entry', () => {
  const entries = [
    { type: 'ConfigWarning', prodError: true, message: 'prod' },
    { type: 'TenantNoneNotice', level: 'info', message: 'notice' },
    { type: 'ConfigWarning', message: 'plain' },
  ];

  const selected = selectBarEntry(entries);
  expect(selected.prodError).toBe(true);
  expect(getErrorBarColor(entries)).toBe('#ad4e00');
});
