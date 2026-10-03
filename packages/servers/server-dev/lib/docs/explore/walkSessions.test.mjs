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
  getWalk,
  listWalks,
  recordError,
  registerWalk,
  removeWalk,
  takeErrors,
} from './walkSessions.js';

const run = '20261003T151200Z-p0d4rm';

afterEach(() => {
  listWalks().forEach((walk) => removeWalk(walk.walkId));
});

function entry({ journey = 'walk-1', timestamp, message = 'boom' }) {
  return { timestamp, message, recording: { source: 'explorer', run, journey } };
}

test('recordError puts an entry in the buffer of the walk whose run and walk id it carries', () => {
  registerWalk({ walkId: 'walk-1', run, journey: 'walk-1', pageId: 'tickets' });
  registerWalk({ walkId: 'walk-2', run, journey: 'walk-2' });
  expect(recordError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(true);
  expect(getWalk('walk-1').errors).toHaveLength(1);
  expect(getWalk('walk-1').pageId).toEqual('tickets');
  expect(getWalk('walk-2').errors).toEqual([]);
});

test('recordError drops an entry for a walk that is not open', () => {
  registerWalk({ walkId: 'walk-1', run, journey: 'walk-1' });
  removeWalk('walk-1');
  expect(recordError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(false);
  expect(getWalk('walk-1')).toBeNull();
  registerWalk({ walkId: 'walk-2', run: '20261003T151200Z-other1', journey: 'walk-1' });
  expect(recordError(entry({ timestamp: '2026-10-03T15:12:01.000Z' }))).toBe(false);
});

test('takeErrors removes and returns the errors inside the step window', () => {
  registerWalk({ walkId: 'walk-1', run, journey: 'walk-1' });
  recordError(entry({ timestamp: '2026-10-03T15:12:01.000Z', message: 'before' }));
  recordError(entry({ timestamp: '2026-10-03T15:12:03.000Z', message: 'during' }));
  recordError(entry({ timestamp: '2026-10-03T15:12:09.000Z', message: 'after' }));
  const taken = takeErrors({
    walkId: 'walk-1',
    since: Date.parse('2026-10-03T15:12:02.000Z'),
    until: Date.parse('2026-10-03T15:12:05.000Z'),
  });
  expect(taken.map((error) => error.message)).toEqual(['during']);
  expect(getWalk('walk-1').errors.map((error) => error.message)).toEqual(['before', 'after']);
  expect(takeErrors({ walkId: 'gone', since: 0, until: Date.now() })).toEqual([]);
});

test('registerWalk requires string walkId, run and journey', () => {
  expect(() => registerWalk({ walkId: 'walk-1', run })).toThrow(
    'registerWalk requires string "walkId", "run" and "journey".'
  );
});
