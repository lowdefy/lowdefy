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

import resolveLoadingState from './resolveLoadingState.js';

test('resolveLoadingState is initial while loading with no rows', () => {
  expect(resolveLoadingState({ loading: true, sourceCount: 0, displayCount: 0 })).toBe('initial');
});

test('resolveLoadingState is refreshing while loading with rows on screen', () => {
  expect(resolveLoadingState({ loading: true, sourceCount: 5, displayCount: 5 })).toBe(
    'refreshing'
  );
});

test('resolveLoadingState is refreshing while a view change is pending', () => {
  expect(
    resolveLoadingState({ loading: false, pending: true, sourceCount: 5, displayCount: 5 })
  ).toBe('refreshing');
});

test('resolveLoadingState is empty with no rows and nothing loading', () => {
  expect(resolveLoadingState({ loading: false, sourceCount: 0, displayCount: 0 })).toBe('empty');
});

test('resolveLoadingState is empty, not initial, when a filter hides every row while loading', () => {
  expect(resolveLoadingState({ loading: true, sourceCount: 5, displayCount: 0 })).toBe('empty');
});

test('resolveLoadingState is ready with rows and nothing loading', () => {
  expect(resolveLoadingState({ loading: false, sourceCount: 5, displayCount: 5 })).toBe('ready');
});
