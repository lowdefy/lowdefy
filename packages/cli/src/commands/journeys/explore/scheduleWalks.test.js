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
  return {
    walk: walkId,
    walkIndex,
    pageId: target.pageId,
    user: target.user,
    charter: target.charter ?? null,
    stopReason,
  };
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

test('three charters share the rounds under one budget, one walk open at a time', async () => {
  // resolveWalkTargets' order: one target from each charter in turn. Two
  // charters on the same page and role are two targets.
  const charterTargets = [
    { pageId: 'invoice', user: 'admin', charter: 0 },
    { pageId: 'invoice', user: 'admin', charter: 1 },
    { pageId: 'tickets', user: 'member', charter: 2 },
    { pageId: 'invoice', user: 'member', charter: 0 },
  ];
  const order = [];
  let open = 0;
  let mostOpen = 0;
  let walked = 0;
  const { logs, notRun, stopped } = await scheduleWalks({
    targets: charterTargets,
    walks: 3,
    shouldStop: () => (walked >= 6 ? 'budget' : null),
    buildChanged: async () => false,
    runOne: async (walk) => {
      open += 1;
      mostOpen = Math.max(mostOpen, open);
      await new Promise((resolve) => setTimeout(resolve, 1));
      order.push(
        `${walk.target.charter}:${walk.target.pageId}/${walk.target.user}/${walk.walkIndex}`
      );
      walked += 1;
      open -= 1;
      return logFor(walk);
    },
  });
  expect(mostOpen).toBe(1);
  expect(order).toEqual([
    '0:invoice/admin/0',
    '1:invoice/admin/0',
    '2:tickets/member/0',
    '0:invoice/member/0',
    '0:invoice/admin/1',
    '1:invoice/admin/1',
  ]);
  expect(logs).toHaveLength(6);
  expect(stopped).toEqual({ reason: 'budget' });
  expect(notRun).toEqual([
    { pageId: 'invoice', user: 'admin', charter: 0, reason: 'budget', walks: 1 },
    { pageId: 'invoice', user: 'admin', charter: 1, reason: 'budget', walks: 1 },
    { pageId: 'tickets', user: 'member', charter: 2, reason: 'budget', walks: 2 },
    { pageId: 'invoice', user: 'member', charter: 0, reason: 'budget', walks: 2 },
  ]);
});
