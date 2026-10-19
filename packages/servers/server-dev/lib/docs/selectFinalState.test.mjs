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

import selectFinalState, { DEFAULT_STATE_LIMIT } from './selectFinalState.js';

test('selectFinalState returns a small state whole by default', () => {
  expect(selectFinalState({ state: { a: 1 } })).toEqual({ state: { a: 1 } });
});

test('selectFinalState summarises a state over the limit, largest key first', () => {
  const state = { small: 1, large: 'x'.repeat(DEFAULT_STATE_LIMIT) };
  const { state: returned, stateOmitted } = selectFinalState({ state });
  expect(returned).toBeUndefined();
  expect(stateOmitted.characters).toEqual(JSON.stringify(state).length);
  expect(Object.entries(stateOmitted.keys)).toEqual([
    ['large', DEFAULT_STATE_LIMIT + 2],
    ['small', 1],
  ]);
});

test('selectFinalState returns the paths asked for, null where undefined', () => {
  const state = { form: { name: 'Ada', tags: [] }, flag: false };
  expect(selectFinalState({ state, selection: ['form.name', 'flag', 'form.missing'] })).toEqual({
    state: { 'form.name': 'Ada', flag: false, 'form.missing': null },
  });
});

test('selectFinalState returns nothing for false and everything for true', () => {
  const state = { large: 'x'.repeat(DEFAULT_STATE_LIMIT * 2) };
  expect(selectFinalState({ state, selection: false })).toEqual({});
  expect(selectFinalState({ state, selection: true })).toEqual({ state });
});

test('selectFinalState passes a state read error through whatever was selected', () => {
  const state = { error: 'Could not read final state: Target closed' };
  expect(selectFinalState({ state, selection: ['a'] })).toEqual({ state });
  expect(selectFinalState({ state })).toEqual({ state });
});
