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

import buildTimelineRows from './buildTimelineRows.js';

const sam = { id: 'u1', name: 'Sam Tolmay' };
const ada = { id: 'u2', name: 'Ada Lovelace' };
const nigel = { id: 'u1', name: 'Sam Tolmay', agent: true };

const formatEvent = {
  edit: { summary: 'edited the {what.field}' },
  'decision-recorded': { summary: 'recorded {n} decision{s}' },
};

const detail = (id, by, type = 'edit', what = { field: 'body' }) => ({
  id,
  at: `2026-10-18T10:0${id.slice(1)}:00Z`,
  tier: 'detail',
  type,
  by,
  what,
});
const key = (id, by) => ({
  id,
  at: `2026-10-18T10:0${id.slice(1)}:00Z`,
  tier: 'key',
  type: 'status-change',
  by,
});

test('buildTimelineRows folds consecutive detail events by one actor into a group', () => {
  const rows = buildTimelineRows({
    entries: [
      detail('e1', sam),
      detail('e2', sam, 'decision-recorded'),
      detail('e3', sam, 'decision-recorded'),
      detail('e4', sam, 'decision-recorded'),
    ],
    formatEvent,
  });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    type: 'group',
    id: 'group:e1',
    at: '2026-10-18T10:04:00Z',
    summary: 'edited the body and recorded 3 decisions',
  });
  expect(rows[0].line.segments[1]).toEqual({
    kind: 'text',
    text: ' edited the body and recorded 3 decisions',
  });
  expect(rows[0].events.map((event) => event.id)).toEqual(['e1', 'e2', 'e3', 'e4']);
});

test('buildTimelineRows keeps a lone detail event on its own line', () => {
  const rows = buildTimelineRows({ entries: [detail('e1', sam), detail('e2', ada)], formatEvent });
  expect(rows.map((row) => [row.type, row.id])).toEqual([
    ['event', 'e1'],
    ['event', 'e2'],
  ]);
});

test('buildTimelineRows breaks a run at another actor, and tells an agent from the person', () => {
  const rows = buildTimelineRows({
    entries: [detail('e1', sam), detail('e2', sam), detail('e3', nigel), detail('e4', nigel)],
    formatEvent,
  });
  expect(rows.map((row) => row.id)).toEqual(['group:e1', 'group:e3']);
  expect(rows[1].actor.agent).toBe(true);
});

test('buildTimelineRows breaks a run at a key event and at a comment', () => {
  const rows = buildTimelineRows({
    entries: [
      detail('e1', sam),
      detail('e2', sam),
      key('e3', sam),
      detail('e4', sam),
      { id: 'c1', type: 'comment', at: '2026-10-18T10:05:00Z', by: sam, body: 'Hi' },
      detail('e6', sam),
      detail('e7', sam),
    ],
    formatEvent,
  });
  expect(rows.map((row) => [row.type, row.id])).toEqual([
    ['group', 'group:e1'],
    ['event', 'e3'],
    ['event', 'e4'],
    ['thread', 'c1'],
    ['group', 'group:e6'],
  ]);
});

test('buildTimelineRows shows every detail event on its own line with foldDetail false', () => {
  const rows = buildTimelineRows({
    entries: [detail('e1', sam), detail('e2', sam)],
    foldDetail: false,
    formatEvent,
  });
  expect(rows.map((row) => row.type)).toEqual(['event', 'event']);
});

test('buildTimelineRows draws an inline gap where it is, and places listed gaps by time', () => {
  const rows = buildTimelineRows({
    entries: [
      key('e1', sam),
      { type: 'gap', count: 3, actors: [ada] },
      key('e3', sam),
      key('e5', sam),
    ],
    gaps: [
      {
        after: '2026-10-18T10:03:00Z~e3',
        before: '2026-10-18T10:05:00Z',
        count: 14,
        actors: [sam, ada],
      },
    ],
  });
  expect(rows.map((row) => row.type)).toEqual(['event', 'gap', 'event', 'gap', 'event']);
  expect(rows[3].gap).toMatchObject({ count: 14, after: '2026-10-18T10:03:00Z~e3' });
});

test('buildTimelineRows places a gap with only before ahead of the entries from that time', () => {
  const rows = buildTimelineRows({
    entries: [key('e3', sam), key('e5', sam)],
    gaps: [{ after: null, before: '2026-10-18T10:03:00Z', count: 2 }],
  });
  expect(rows.map((row) => row.type)).toEqual(['gap', 'event', 'event']);
});

test('buildTimelineRows leaves out gaps with nothing in them', () => {
  const rows = buildTimelineRows({ entries: [key('e1', sam)], gaps: [{ after: null, count: 0 }] });
  expect(rows.map((row) => row.type)).toEqual(['event']);
});

test('buildTimelineRows starts with Show earlier activity while earlier is true', () => {
  const rows = buildTimelineRows({ entries: [key('e1', sam)], earlier: true });
  expect(rows[0]).toEqual({ type: 'earlier', id: 'earlier', before: '2026-10-18T10:01:00Z' });
});

test('buildTimelineRows folds a resolved thread and drops a deleted one with nothing left', () => {
  const rows = buildTimelineRows({
    entries: [
      { id: 'c1', type: 'comment', by: sam, resolved: { by: ada, at: '2026-10-18T11:00:00Z' } },
      { id: 'c2', type: 'comment', by: sam, deleted: true, replies: [] },
      { id: 'c3', type: 'comment', by: sam, deleted: true, replies: [{ id: 'r1', by: ada }] },
      { id: 'c4', type: 'comment', by: sam, deleted: true, reply_count: 2 },
      { id: 'c5', type: 'comment', by: sam, deleted: true, replies: [{ id: 'r2', deleted: true }] },
    ],
  });
  expect(rows.map((row) => [row.type, row.id])).toEqual([
    ['resolved', 'c1'],
    ['thread', 'c3'],
    ['thread', 'c4'],
  ]);
});
