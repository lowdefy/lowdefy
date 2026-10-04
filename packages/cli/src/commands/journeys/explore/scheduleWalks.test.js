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

import scheduleWalks from './scheduleWalks.js';

const targets = [
  { pageId: 'tickets', user: 'admin' },
  { pageId: 'tickets', user: 'member' },
  { pageId: 'settings', user: 'admin' },
];

function logFor({ target, walkId, walkIndex }, stopReason = 'steps') {
  return { walk: walkId, walkIndex, pageId: target.pageId, user: target.user, stopReason };
}

test('walks run breadth-first: every target gets its first walk before any gets a second', async () => {
  const order = [];
  const { logs, stopped } = await scheduleWalks({
    targets,
    walks: 2,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) => {
      order.push(`${walk.target.pageId}/${walk.target.user}/${walk.walkIndex}`);
      return logFor(walk);
    },
  });
  expect(order).toEqual([
    'tickets/admin/0',
    'tickets/member/0',
    'settings/admin/0',
    'tickets/admin/1',
    'tickets/member/1',
    'settings/admin/1',
  ]);
  expect(logs.map((log) => log.walk)).toEqual([
    'walk-1',
    'walk-2',
    'walk-3',
    'walk-4',
    'walk-5',
    'walk-6',
  ]);
  expect(stopped).toBe(null);
});

test('with budget for 3 walks over 3 targets, each target gets one and the rest are not run', async () => {
  let walked = 0;
  const { logs, notRun, stopped } = await scheduleWalks({
    targets,
    walks: 5,
    shouldStop: () => (walked >= 3 ? 'budget' : null),
    buildChanged: async () => false,
    runOne: async (walk) => {
      walked += 1;
      return logFor(walk);
    },
  });
  expect(logs.map((log) => `${log.pageId}/${log.user}`)).toEqual([
    'tickets/admin',
    'tickets/member',
    'settings/admin',
  ]);
  expect(stopped).toEqual({ reason: 'budget' });
  expect(notRun).toEqual(targets.map((target) => ({ ...target, reason: 'budget', walks: 4 })));
});

test('a walk that ran out of budget mid-walk ends the run, keeping its log for the report', async () => {
  const { logs, stopped } = await scheduleWalks({
    targets,
    walks: 5,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) => logFor(walk, walk.walkId === 'walk-2' ? 'budget' : 'steps'),
  });
  expect(logs.map((log) => log.stopReason)).toEqual(['steps', 'budget']);
  expect(stopped).toEqual({ reason: 'budget' });
});

test('a refused target is dropped and listed with why', async () => {
  const { logs, notRun } = await scheduleWalks({
    targets,
    walks: 3,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) =>
      logFor(walk, walk.target.user === 'member' ? 'access-changed' : 'steps'),
  });
  expect(logs.filter((log) => log.user === 'member')).toHaveLength(1);
  expect(notRun).toEqual([{ pageId: 'tickets', user: 'member', reason: 'access-changed' }]);
});

test('a walk that finds the server restarted on the same build is retried once', async () => {
  let first = true;
  const { logs } = await scheduleWalks({
    targets: [targets[0]],
    walks: 1,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) => {
      const reason = first ? 'server-restarted' : 'steps';
      first = false;
      return logFor(walk, reason);
    },
  });
  expect(logs.map((log) => [log.walk, log.walkIndex, log.stopReason])).toEqual([
    ['walk-1', 0, 'server-restarted'],
    ['walk-2', 0, 'steps'],
  ]);
});

test('a build id change mid-run stops the run', async () => {
  const { logs, stopped } = await scheduleWalks({
    targets,
    walks: 2,
    shouldStop: () => null,
    buildChanged: async () => true,
    runOne: async (walk) => logFor(walk, walk.walkId === 'walk-2' ? 'server-restarted' : 'steps'),
  });
  expect(logs).toHaveLength(2);
  expect(stopped.reason).toBe('server-restarted');
  expect(stopped.message).toMatch(/changed build/);
});

test('a walk that throws stops the run with its error and keeps the earlier walks', async () => {
  const { logs, stopped } = await scheduleWalks({
    targets,
    walks: 1,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) => {
      if (walk.walkId === 'walk-2') throw new Error('Gateway down');
      return logFor(walk);
    },
  });
  expect(logs).toHaveLength(1);
  expect(stopped).toEqual({ reason: 'error', message: 'Gateway down' });
});

test('afterWalk runs after each walk, so confirmation replays count against the budget', async () => {
  const seen = [];
  await scheduleWalks({
    targets: [targets[0]],
    walks: 2,
    shouldStop: () => null,
    buildChanged: async () => false,
    runOne: async (walk) => logFor(walk),
    afterWalk: async (log) => seen.push(log.walk),
  });
  expect(seen).toEqual(['walk-1', 'walk-2']);
});
