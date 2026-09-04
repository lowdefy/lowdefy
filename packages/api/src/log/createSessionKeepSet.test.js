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

import createSessionKeepSet from './createSessionKeepSet.js';

test('createSessionKeepSet holds a kept session and reports an unknown one as not kept', () => {
  const keepSet = createSessionKeepSet({ max: 3 });
  keepSet.keep('sess-1');

  expect(keepSet.has('sess-1')).toBe(true);
  expect(keepSet.has('sess-2')).toBe(false);
});

test('createSessionKeepSet evicts the oldest session once max is exceeded', () => {
  const keepSet = createSessionKeepSet({ max: 2 });
  keepSet.keep('sess-1');
  keepSet.keep('sess-2');
  keepSet.keep('sess-3');

  expect(keepSet.size()).toEqual(2);
  expect(keepSet.has('sess-1')).toBe(false);
  expect(keepSet.has('sess-2')).toBe(true);
  expect(keepSet.has('sess-3')).toBe(true);
});

test('createSessionKeepSet keeping a held session again makes it the newest, not a duplicate', () => {
  const keepSet = createSessionKeepSet({ max: 2 });
  keepSet.keep('sess-1');
  keepSet.keep('sess-2');
  keepSet.keep('sess-1');
  keepSet.keep('sess-3');

  expect(keepSet.size()).toEqual(2);
  expect(keepSet.has('sess-1')).toBe(true);
  expect(keepSet.has('sess-2')).toBe(false);
});

test('createSessionKeepSet ignores a session id that is not a string', () => {
  const keepSet = createSessionKeepSet({ max: 2 });
  keepSet.keep(null);
  keepSet.keep(undefined);
  keepSet.keep({ session_id: 'sess-1' });

  expect(keepSet.size()).toEqual(0);
  expect(keepSet.has(null)).toBe(false);
  expect(keepSet.has(undefined)).toBe(false);
});
