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

import {
  recordRunError,
  registerRunBuffer,
  releaseRunBuffer,
  takeRunErrors,
} from './runErrorBuffers.js';

const run = '20261003T151200Z-p0d4rm';
const journeyRun = { run, journey: 'tests/journeys/a.yaml#A' };

function entry({ journey = journeyRun.journey, timestamp, message = 'boom' }) {
  return { timestamp, message, recording: { source: 'journey', run, journey } };
}

function takeAll(buffer) {
  return takeRunErrors({ ...buffer, since: 0, until: Number.MAX_SAFE_INTEGER });
}

afterEach(() => {
  releaseRunBuffer(journeyRun);
  releaseRunBuffer({ run, journey: null });
});

test('recordRunError puts an entry in the buffer of the run and journey it carries', () => {
  registerRunBuffer(journeyRun);
  registerRunBuffer({ run, journey: null });
  expect(recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(true);
  expect(takeAll(journeyRun)).toHaveLength(1);
  expect(takeAll({ run, journey: null })).toEqual([]);
});

test('recordRunError matches a run that names no journey', () => {
  registerRunBuffer({ run, journey: null });
  expect(recordRunError(entry({ journey: null, timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(
    true
  );
  expect(takeAll({ run, journey: null }).map((error) => error.message)).toEqual(['boom']);
});

test('recordRunError refuses an entry for a run whose buffer is not open', () => {
  expect(recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(false);
  registerRunBuffer(journeyRun);
  releaseRunBuffer(journeyRun);
  expect(recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(false);
  expect(recordRunError({ timestamp: '2026-10-03T15:12:01.000Z', recording: null })).toBe(false);
});

test('takeRunErrors removes and returns the errors inside the window', () => {
  registerRunBuffer(journeyRun);
  recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z', message: 'before' }));
  recordRunError(entry({ timestamp: '2026-10-03T15:12:03.000Z', message: 'during' }));
  recordRunError(entry({ timestamp: '2026-10-03T15:12:09.000Z', message: 'after' }));
  const taken = takeRunErrors({
    ...journeyRun,
    since: Date.parse('2026-10-03T15:12:02.000Z'),
    until: Date.parse('2026-10-03T15:12:05.000Z'),
  });
  expect(taken.map((error) => error.message)).toEqual(['during']);
  expect(takeAll(journeyRun).map((error) => error.message)).toEqual(['before', 'after']);
  expect(takeAll({ run: '20261003T151200Z-other1', journey: null })).toEqual([]);
});

test('a buffer registered twice stays open until both holders release it', () => {
  registerRunBuffer(journeyRun);
  registerRunBuffer(journeyRun);
  releaseRunBuffer(journeyRun);
  expect(recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(true);
  releaseRunBuffer(journeyRun);
  expect(recordRunError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(false);
});

test('registerRunBuffer requires a string run and a string or null journey', () => {
  expect(() => registerRunBuffer({ run, journey: undefined })).toThrow(
    'registerRunBuffer requires a string "run" and a string or null "journey".'
  );
  expect(() => registerRunBuffer({ run: 7, journey: null })).toThrow(
    'registerRunBuffer requires a string "run" and a string or null "journey". Received {"run":7,"journey":null}.'
  );
});
