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

import { expect, test } from 'vitest';

import committedJourneys from './committedJourneys.js';
import expandJourney from '../test/expandJourney.js';

const context = { directories: { config: '/app' } };
const filePath = '/app/tests/journeys/a.yaml';

const table = {
  name: 'opens each page',
  pageId: { _case: 'page' },
  cases: [
    { name: 'orders', page: 'orders' },
    { name: 'refunds', page: 'refunds' },
  ],
  steps: [{ click: 'submit' }],
};
const personas = {
  name: 'edits',
  pageId: 'form',
  data: 'tickets',
  user: ['admin', 'member'],
  steps: [{ click: 'submit' }],
};

const discovered = [
  { filePath, journeyIndex: 0, journey: table },
  { filePath, journeyIndex: 1, journey: personas },
];

test('committedJourneys reads a case table and a user list once each, from discovered items', () => {
  const { journeys, skipped } = committedJourneys({ context, items: discovered });
  expect(skipped).toEqual([]);
  expect(journeys).toEqual([
    {
      filePath,
      file: 'tests/journeys/a.yaml',
      journeyIndex: 0,
      journey: { name: 'opens each page [orders]', pageId: 'orders', steps: [{ click: 'submit' }] },
    },
    { filePath, file: 'tests/journeys/a.yaml', journeyIndex: 1, journey: personas },
  ]);
});

test('committedJourneys reads selected runs the same way as discovered items', () => {
  const selected = discovered.flatMap((item) => expandJourney({ item }));
  expect(selected).toHaveLength(4);
  expect(committedJourneys({ context, items: selected })).toEqual(
    committedJourneys({ context, items: discovered })
  );
});

test('committedJourneys skips a case table that does not validate', () => {
  const { journeys, skipped } = committedJourneys({
    context,
    items: [{ filePath, journeyIndex: 0, journey: { ...table, cases: [{ name: 'x' }] } }],
  });
  expect(journeys).toEqual([]);
  expect(skipped).toEqual([
    'tests/journeys/a.yaml: Journey case "x" has no "page" for _case to read.',
  ]);
});
