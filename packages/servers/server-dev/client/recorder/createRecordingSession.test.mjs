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

import createRecordingSession from './createRecordingSession.js';

const START = Date.parse('2026-10-03T14:03:11.000Z');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
  };
}

test('createRecordingSession keeps one session id while the tab is active', () => {
  let time = START;
  const session = createRecordingSession({ storage: createStorage(), now: () => time });
  const id = session.getId();
  expect(id).toMatch(/^20261003T140311Z-[a-z0-9]{6}$/);
  time += 9 * 60 * 1000;
  expect(session.getId()).toBe(id);
  time += 9 * 60 * 1000;
  expect(session.getId()).toBe(id);
});

test('createRecordingSession starts a new session after 10 minutes idle', () => {
  let time = START;
  const session = createRecordingSession({ storage: createStorage(), now: () => time });
  const id = session.getId();
  time += 10 * 60 * 1000 + 1;
  const next = session.getId();
  expect(next).not.toBe(id);
  expect(next).toMatch(/^20261003T141311Z-/);
});

test('createRecordingSession survives a reload through sessionStorage', () => {
  const storage = createStorage();
  let time = START;
  const id = createRecordingSession({ storage, now: () => time }).getId();
  time += 2000;
  expect(createRecordingSession({ storage, now: () => time }).getId()).toBe(id);
});

test('createRecordingSession records under an unremembered session when storage throws', () => {
  const storage = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };
  let time = START;
  const session = createRecordingSession({ storage, now: () => time });
  const id = session.getId();
  time += 1000;
  expect(session.getId()).toBe(id);
});
