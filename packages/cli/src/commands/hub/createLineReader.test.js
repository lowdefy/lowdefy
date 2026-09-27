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

import { jest } from '@jest/globals';

import createLineReader from './createLineReader.js';

test('createLineReader joins messages split across chunks and reads several from one chunk', () => {
  const onMessage = jest.fn();
  const onData = createLineReader({ onMessage });
  onData('{"id":1,"meth');
  onData('od":"hello"}\n{"id":2}\n{"id"');
  onData(':3}\n');
  expect(onMessage.mock.calls.map(([message]) => message.id)).toEqual([1, 2, 3]);
});

test.each([['{not json'], ['42']])(
  'createLineReader drops the line %s instead of throwing, and keeps reading',
  (line) => {
    const onMessage = jest.fn();
    const onData = createLineReader({ onMessage });
    expect(() => onData(`${line}\n{"id":1}\n`)).not.toThrow();
    expect(onMessage.mock.calls).toEqual([[{ id: 1 }]]);
  }
);
