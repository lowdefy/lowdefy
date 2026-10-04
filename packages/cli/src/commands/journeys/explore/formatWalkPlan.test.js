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

import formatWalkPlan from './formatWalkPlan.js';
import orderTargets from './orderTargets.js';

test('the plan counts walk open and close time beside the steps', () => {
  const targets = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap((pageId) => [
    { pageId, user: 'admin' },
    { pageId, user: 'member' },
  ]);
  expect(
    formatWalkPlan({ targets, walks: 5, steps: 15, budgetMs: 20 * 60000, walkOverheadMs: 6000 })
  ).toBe(
    '6 pages, 12 (page, role) targets × 5 walks × 15 steps = 900 steps at most; at ~2 s a step plus ~6 s to open and close each of 60 walks, that is ~36 min; budget 20 min, breadth-first.'
  );
});

test('targets are ordered by the size of their change, then app-wide and manual pages, roles kept in order', () => {
  const scopePages = [
    { pageId: 'home', reasons: ['app-wide'], blocks: [] },
    { pageId: 'invoices', reasons: ['request:list', 'endpoint:sum'], blocks: [] },
    {
      pageId: 'ticket',
      reasons: ['page'],
      blocks: [
        { blockId: 'a', change: 'added' },
        { blockId: 'b', change: 'changed' },
        { blockId: 'c', change: 'removed' },
      ],
    },
    { pageId: 'tickets', reasons: ['page'], blocks: [{ blockId: 'x', change: 'changed' }] },
  ];
  const targets = [
    { pageId: 'home', user: 'admin' },
    { pageId: 'invoices', user: 'admin' },
    { pageId: 'ticket', user: 'admin' },
    { pageId: 'ticket', user: 'member' },
    { pageId: 'tickets', user: 'admin' },
  ];
  expect(orderTargets({ scopePages, targets }).map((t) => `${t.pageId}/${t.user}`)).toEqual([
    'ticket/admin',
    'ticket/member',
    'tickets/admin',
    'invoices/admin',
    'home/admin',
  ]);
});
