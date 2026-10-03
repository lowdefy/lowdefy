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

import { journeySequence, profileProduction } from '@lowdefy/node-utils';

import computeCoverage from './computeCoverage.js';

function identity(verb, blockId, text = null) {
  return JSON.stringify([verb, blockId, null, text]);
}

function segment({
  hash,
  session,
  page = 'tickets',
  steps,
  persons = ['p_1'],
  roles = null,
  failure_path,
  frustrations = [],
}) {
  return {
    hash,
    session,
    page_id: page,
    pages: [page],
    sequence: steps.map(([verb, blockId, text]) => ({
      page,
      identity: identity(verb, blockId, text),
    })),
    persons,
    orgs: [],
    roles,
    failure: failure_path ? 'failed' : undefined,
    failure_path,
    frustrations,
    first_seen: '2026-10-01T10:00:00.000Z',
  };
}

function committed(journey) {
  return {
    file: `tests/journeys/${journey.name}.yaml`,
    name: journey.name,
    pageId: journey.pageId,
    sequence: journeySequence({ pageId: journey.pageId, steps: journey.steps }),
    journey,
  };
}

const segments = [
  // Backed by "saves": extra clicks in the segment are allowed.
  segment({
    hash: 'h1',
    session: 's1',
    steps: [
      ['click', 'edit'],
      ['click', 'title'],
      ['click', 'save'],
    ],
    roles: ['member'],
  }),
  segment({
    hash: 'h1',
    session: 's2',
    steps: [
      ['click', 'edit'],
      ['click', 'title'],
      ['click', 'save'],
    ],
    roles: ['member'],
  }),
  segment({
    hash: 'h2',
    session: 's3',
    steps: [['click', 'close']],
    roles: ['admin', 'member'],
    failure_path: {
      page: 'tickets',
      block_id: 'close',
      event: 'onClick',
      invalid_blocks: [],
      interaction: true,
    },
    frustrations: [{ page: 'tickets', block_id: 'close', text: null, kind: 'rage' }],
  }),
  segment({
    hash: 'h3',
    session: 's4',
    steps: [['click', 'groups.$.rows.$.review']],
    failure_path: {
      page: 'tickets',
      block_id: 'save',
      event: 'onClick',
      invalid_blocks: ['title'],
      interaction: true,
    },
    frustrations: [
      { page: 'tickets', block_id: 'groups.2.rows.0.review', text: null, kind: 'dead' },
    ],
  }),
];

const saves = committed({
  name: 'saves',
  pageId: 'tickets',
  user: { roles: ['member'] },
  steps: [{ click: 'edit' }, { click: 'save' }],
});
const reviews = committed({
  name: 'reviews',
  pageId: 'tickets',
  user: { roles: ['admin'] },
  steps: [{ click: 'groups.0.rows.1.review' }, { expect: { visible: 'done' } }, { click: 'close' }],
});

function coverage(journeys) {
  return computeCoverage({ journeys, segments, profile: profileProduction({ segments }) });
}

test('computeCoverage weights interactions by occurrence', () => {
  const { interaction } = coverage([saves]);
  // edit x2 and save x2 covered; title x2, close, review uncovered.
  expect(interaction).toMatchObject({ covered: 4, total: 8, share: 0.5 });
  expect(interaction.uncovered.map((item) => [item.identity, item.count])).toEqual([
    [identity('click', 'title'), 2],
    [identity('click', 'close'), 1],
    [identity('click', 'groups.$.rows.$.review'), 1],
  ]);
});

test('computeCoverage covers a flow a journey backs despite extra clicks in the segment', () => {
  const { flow } = coverage([saves]);
  expect(flow).toMatchObject({ covered: 2, total: 4, share: 0.5 });
  expect(flow.uncovered.map((item) => item.hash)).toEqual(['h2', 'h3']);
});

test('computeCoverage reports failure coverage as reached', () => {
  const { failure } = coverage([reviews]);
  expect(failure.mode).toBe('reached');
  expect(failure.note).toContain('journey recordings');
  // reviews clicks close (h2's failing interaction) and the review button (h3's).
  expect(failure).toMatchObject({ covered: 2, total: 2 });
  expect(coverage([saves]).failure).toMatchObject({ covered: 0, total: 2 });
});

test('computeCoverage covers a frustrated click only when an expect follows it', () => {
  const { frustration } = coverage([reviews]);
  expect(frustration).toMatchObject({ covered: 1, total: 2 });
  expect(frustration.uncovered.map((item) => item.key)).toEqual(['tickets.close']);
});

test('computeCoverage matches role sets exactly, signed out as []', () => {
  const { role } = coverage([saves, reviews]);
  // [member] covered by saves; [admin, member] is not covered by [admin]; [] is uncovered.
  expect(role).toMatchObject({ covered: 1, total: 3 });
  expect(role.uncovered.map((item) => item.roles)).toEqual([['admin', 'member'], []]);
});

test('computeCoverage counts a journey without a user as signed out', () => {
  const signedOut = committed({ name: 'anonymous', pageId: 'tickets', steps: [{ click: 'x' }] });
  expect(coverage([signedOut]).role.uncovered.map((item) => item.roles)).not.toContainEqual([]);
});

test('computeCoverage covers nothing without journeys', () => {
  const measures = coverage([]);
  Object.values(measures).forEach((entry) => {
    expect(entry.covered).toBe(0);
  });
});
