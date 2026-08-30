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
import serverErrorStore from './serverErrorStore.js';

test('serverErrorStore push adds an entry and list returns it', () => {
  serverErrorStore.push({ message: 'first' });
  expect(serverErrorStore.list()).toEqual([{ message: 'first' }]);
});

test('serverErrorStore list returns a copy that does not alias the store', () => {
  const entries = serverErrorStore.list();
  entries.push({ message: 'not stored' });
  expect(serverErrorStore.list()).toEqual([{ message: 'first' }]);
});

test('serverErrorStore caps at 50 entries and drops the oldest', () => {
  for (let i = 0; i < 60; i++) {
    serverErrorStore.push({ index: i });
  }
  const entries = serverErrorStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[0].index).toEqual(10);
  expect(entries[49].index).toEqual(59);
});
