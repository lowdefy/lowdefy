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

import getSendState from './getSendState.js';

test('getSendState disables send while the text is empty or only whitespace', () => {
  expect(getSendState({ value: '', sending: false, maxLength: 4000 }).disabled).toBe(true);
  expect(getSendState({ value: '  \n ', sending: false, maxLength: 4000 }).disabled).toBe(true);
  expect(getSendState({ value: undefined, sending: false, maxLength: 4000 }).disabled).toBe(true);
  expect(getSendState({ value: 'Hi', sending: false, maxLength: 4000 }).disabled).toBe(false);
});

test('getSendState disables send while it sends', () => {
  expect(getSendState({ value: 'Hi', sending: true, maxLength: 4000 }).disabled).toBe(true);
});

test('getSendState shows no counter until the text is near the limit', () => {
  expect(getSendState({ value: 'x'.repeat(3600), sending: false, maxLength: 4000 })).toEqual({
    disabled: false,
    counter: null,
  });
  expect(getSendState({ value: 'x'.repeat(3601), sending: false, maxLength: 4000 })).toEqual({
    disabled: false,
    counter: { text: '3601/4000', over: false },
  });
});

test('getSendState disables send and marks the counter over the limit', () => {
  expect(getSendState({ value: 'x'.repeat(4001), sending: false, maxLength: 4000 })).toEqual({
    disabled: true,
    counter: { text: '4001/4000', over: true },
  });
});

test('getSendState starts the counter a tenth short of a small limit', () => {
  expect(getSendState({ value: 'x'.repeat(91), sending: false, maxLength: 100 }).counter).toEqual({
    text: '91/100',
    over: false,
  });
  expect(getSendState({ value: 'x'.repeat(90), sending: false, maxLength: 100 }).counter).toBe(
    null
  );
});
