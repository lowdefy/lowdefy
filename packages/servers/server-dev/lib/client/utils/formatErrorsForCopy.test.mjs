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
import formatErrorsForCopy from './formatErrorsForCopy.js';

test('formatErrorsForCopy marks a prod-gated warning after the type prefix', () => {
  expect(
    formatErrorsForCopy([
      { type: 'ConfigWarning', message: '_state is not available.', prodError: true },
    ])
  ).toBe('[ConfigWarning] (fails in prod) _state is not available.');
});

test('formatErrorsForCopy leaves a plain warning prefix unmarked', () => {
  expect(formatErrorsForCopy([{ type: 'ConfigWarning', message: 'Duplicate shortcut.' }])).toBe(
    '[ConfigWarning] Duplicate shortcut.'
  );
});

test('formatErrorsForCopy appends source and stack and joins entries with a blank line', () => {
  expect(
    formatErrorsForCopy([
      { type: 'ConfigError', message: 'Bad type.', source: 'home.yaml:3' },
      { type: 'BlockError', message: 'Render failed.', stack: 'at Block' },
    ])
  ).toBe('[ConfigError] Bad type.\n  Source: home.yaml:3\n\n[BlockError] Render failed.\nat Block');
});
