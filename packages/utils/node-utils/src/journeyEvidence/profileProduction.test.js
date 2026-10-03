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

import profileProduction from './profileProduction.js';

function segment({
  hash,
  session,
  page = 'tickets',
  pages,
  persons = [],
  orgs = [],
  roles = null,
  failure,
  failure_path,
  frustrations = [],
  first_seen = '2026-10-01T10:00:00.000Z',
}) {
  return {
    hash,
    session,
    page_id: page,
    pages: pages ?? [page],
    sequence: [{ page, identity: `["click","${hash}",null,null]` }],
    persons,
    orgs,
    roles,
    failure,
    failure_path,
    frustrations,
    first_seen,
  };
}

const validateFailure = {
  page: 'tickets',
  block_id: 'save',
  event: 'onClick',
  invalid_blocks: ['due', 'title'],
};

const SEGMENTS = [
  segment({ hash: 'aaa', session: 's1', persons: ['p_1'], orgs: ['o_1'], roles: ['member'] }),
  segment({ hash: 'aaa', session: 's2', persons: ['p_2'], orgs: ['o_1'], roles: ['member'] }),
  segment({
    hash: 'bbb',
    session: 's3',
    persons: ['p_1'],
    orgs: ['o_1'],
    roles: ['member', 'admin'],
    failure: 'tickets.save.onClick',
    failure_path: validateFailure,
    frustrations: [{ page: 'tickets', block_id: 'save', text: 'Save', kind: 'rage' }],
  }),
  segment({
    hash: 'ccc',
    session: 's4',
    page: 'home',
    pages: ['home', 'tickets'],
    persons: ['p_3'],
    failure: 'app.onInitAsync',
    failure_path: { page: 'app', block_id: null, event: 'onInitAsync', invalid_blocks: [] },
    frustrations: [
      { page: 'home', block_id: null, text: 'Help', kind: 'dead' },
      { page: 'home', block_id: null, text: 'Help', kind: 'dead' },
    ],
  }),
  segment({
    hash: 'ddd',
    session: 's1',
    page: 'tickets',
    persons: ['p_1'],
    roles: ['member'],
    first_seen: '2026-10-01T11:00:00.000Z',
    failure: 'tickets.save.onClick',
    failure_path: validateFailure,
  }),
];

test('profileProduction ranks flows per entry page with counts and share', () => {
  const { flows } = profileProduction({ segments: SEGMENTS });
  expect(
    flows.map((flow) => [flow.page, flow.hash, flow.sessions, flow.persons, flow.orgs, flow.share])
  ).toEqual([
    ['home', 'ccc', 1, 1, 0, 1],
    ['tickets', 'aaa', 2, 2, 1, 0.5],
    ['tickets', 'bbb', 1, 1, 1, 0.25],
    ['tickets', 'ddd', 1, 1, 0, 0.25],
  ]);
  expect(flows[2].failures).toBe(1);
});

test('profileProduction keeps the top 20 flows per entry page', () => {
  const many = Array.from({ length: 25 }, (_, index) =>
    segment({ hash: `h${String(index).padStart(2, '0')}`, session: `s${index}` })
  );
  const { flows } = profileProduction({ segments: many });
  expect(flows).toHaveLength(20);
  // Equal counts tie-break by hash.
  expect(flows[0].hash).toBe('h00');
  expect(flows[19].hash).toBe('h19');
});

test('profileProduction ranks failure paths by persons then sessions, app failures keyed app.<event>', () => {
  const { failurePaths } = profileProduction({ segments: SEGMENTS });
  expect(failurePaths).toEqual([
    { key: 'tickets.save.onClick [due, title]', ...validateFailure, persons: 1, sessions: 2 },
    {
      key: 'app.onInitAsync',
      page: 'app',
      block_id: null,
      event: 'onInitAsync',
      invalid_blocks: [],
      persons: 1,
      sessions: 1,
    },
  ]);
});

test('profileProduction counts rage and dead clicks per page and block', () => {
  const { frustration } = profileProduction({ segments: SEGMENTS });
  expect(frustration).toEqual([
    { key: 'home.Help', page: 'home', block_id: null, text: 'Help', rage: 0, dead: 2 },
    { key: 'tickets.save', page: 'tickets', block_id: 'save', text: 'Save', rage: 1, dead: 0 },
  ]);
});

test('profileProduction lists the role sets seen per page, signed out as []', () => {
  const { roleMatrix } = profileProduction({ segments: SEGMENTS });
  expect(roleMatrix).toEqual([
    { page: 'home', roles: [], sessions: 1, persons: 1 },
    { page: 'tickets', roles: ['member'], sessions: 2, persons: 2 },
    { page: 'tickets', roles: ['admin', 'member'], sessions: 1, persons: 1 },
    { page: 'tickets', roles: [], sessions: 1, persons: 1 },
  ]);
});

test('profileProduction counts the page each tab session started on', () => {
  const { entryPoints } = profileProduction({ segments: SEGMENTS });
  expect(entryPoints).toEqual([
    { page: 'tickets', sessions: 3 },
    { page: 'home', sessions: 1 },
  ]);
});

test('profileProduction gives the same profile for the same segments', () => {
  expect(profileProduction({ segments: SEGMENTS })).toEqual(
    profileProduction({ segments: [...SEGMENTS] })
  );
  expect(profileProduction({ segments: [] })).toEqual({
    flows: [],
    failurePaths: [],
    frustration: [],
    roleMatrix: [],
    entryPoints: [],
  });
});
