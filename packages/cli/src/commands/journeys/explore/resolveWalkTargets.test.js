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

import resolveWalkTargets from './resolveWalkTargets.js';

const dataSet = {
  users: {
    admin_ann: { roles: ['admin'] },
    member_max: { roles: ['member'] },
  },
};

function scopePage(pageId, reasons) {
  return { pageId, reasons, blocks: [] };
}

const scope = {
  pages: [
    scopePage('invoice', ['page']),
    scopePage('tickets', ['manual']),
    scopePage('settings', ['charter']),
  ],
};

function names(targets) {
  return targets.map((target) => `${target.charter ?? '-'}:${target.pageId}/${target.user}`);
}

test('without charters every scope page is walked as each role, untagged', () => {
  const { targets, notRun } = resolveWalkTargets({
    scope: { pages: [scopePage('invoice', ['page']), scopePage('tickets', ['manual'])] },
    coverage: null,
    dataSet,
    roles: [],
    charters: [],
  });
  expect(names(targets)).toEqual([
    '-:invoice/admin_ann',
    '-:invoice/member_max',
    '-:tickets/admin_ann',
    '-:tickets/member_max',
  ]);
  expect(notRun).toEqual([]);
});

test('each charter walks its own pages and roles, else the default pages and --role, and the charters interleave', () => {
  const { targets } = resolveWalkTargets({
    scope,
    coverage: null,
    dataSet,
    roles: ['member_max'],
    charters: [
      { goal: 'Try edge input.', pages: ['settings'], roles: ['admin_ann'] },
      { goal: 'Try error paths.' },
      { goal: 'Try the invoice form.', pages: ['invoice'] },
    ],
  });
  // The default pages are the scope pages that are there for a reason other
  // than a charter: invoice (changed) and tickets (--page), not settings.
  expect(names(targets)).toEqual([
    '0:settings/admin_ann',
    '1:invoice/member_max',
    '2:invoice/member_max',
    '1:tickets/member_max',
  ]);
});

test('a role set no data set user has is listed as not run once, however many charters walk the page', () => {
  const coverage = {
    production: {
      roleMatrix: [
        { page: 'invoice', roles: ['admin'], sessions: 10 },
        { page: 'invoice', roles: ['auditor'], sessions: 5 },
      ],
    },
  };
  const { targets, notRun } = resolveWalkTargets({
    scope: { pages: [scopePage('invoice', ['page'])] },
    coverage,
    dataSet,
    roles: [],
    charters: [{ goal: 'a' }, { goal: 'b' }],
  });
  expect(names(targets)).toEqual(['0:invoice/admin_ann', '1:invoice/admin_ann']);
  expect(notRun).toEqual([
    { pageId: 'invoice', roles: ['auditor'], reason: 'no data set user has roles [auditor]' },
  ]);
});

test('--role with no data set is refused', () => {
  expect(() =>
    resolveWalkTargets({ scope, coverage: null, dataSet: null, roles: ['admin_ann'], charters: [] })
  ).toThrow('--role names data set users, but no data set resolved. Name one with --data.');
});
