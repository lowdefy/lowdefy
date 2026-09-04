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

import computeJourneyCoverage from './computeJourneyCoverage.js';
import formatJourneyCoverage from './formatJourneyCoverage.js';

// Two pages, six declared triples (four block events, two page requests), and
// one journey on the first page that exercises three of them.
const coverageArtifact = {
  pages: {
    login: {
      events: [
        { blockId: 'email', event: 'onChange' },
        { blockId: 'submit', event: 'onClick' },
      ],
      requestIds: ['sign_in'],
    },
    users: {
      events: [
        { blockId: 'users_table', event: 'onClick' },
        { blockId: 'refresh', event: 'onClick' },
      ],
      requestIds: ['get_users'],
    },
  },
};

const journeys = [
  {
    filePath: 'tests/journeys/signIn.yaml',
    journey: {
      name: 'sign in',
      pageId: 'login',
      steps: [
        { fill: { blockId: 'email', value: 'a@b.c' } },
        { click: 'submit' },
        { wait: { request: 'sign_in' } },
      ],
    },
  },
];

test('computeJourneyCoverage reports the share of declared triples one journey exercises', () => {
  const coverage = computeJourneyCoverage({ coverage: coverageArtifact, journeys });
  expect(coverage.total).toBe(6);
  expect(coverage.covered).toBe(3);
  expect(coverage.share).toBe(0.5);
});

test('computeJourneyCoverage lists the triples no journey touches', () => {
  const coverage = computeJourneyCoverage({ coverage: coverageArtifact, journeys });
  expect(coverage.uncovered).toEqual([
    { pageId: 'users', blockId: 'users_table', event: 'onClick' },
    { pageId: 'users', blockId: 'refresh', event: 'onClick' },
    { pageId: 'users', blockId: 'get_users', event: 'request' },
  ]);
});

test('computeJourneyCoverage indexes each page by the journeys that start on it', () => {
  const coverage = computeJourneyCoverage({
    coverage: coverageArtifact,
    journeys: [
      ...journeys,
      { journey: { name: 'sign in again', pageId: 'login', steps: [{ click: 'submit' }] } },
      { journey: undefined, error: 'Journey file is empty.' },
    ],
  });
  expect(coverage.pageJourneys).toEqual({ login: ['sign in', 'sign in again'] });
});

test('computeJourneyCoverage ignores a journey touch on a block the config does not declare', () => {
  const coverage = computeJourneyCoverage({
    coverage: coverageArtifact,
    journeys: [{ journey: { name: 'stale', pageId: 'login', steps: [{ click: 'deleted' }] } }],
  });
  expect(coverage.covered).toBe(0);
});

test('computeJourneyCoverage is fully covered when the app declares nothing', () => {
  const coverage = computeJourneyCoverage({ coverage: { pages: {} }, journeys: [] });
  expect(coverage).toEqual({
    covered: 0,
    pageJourneys: {},
    share: 1,
    total: 0,
    uncovered: [],
  });
});

test('formatJourneyCoverage names the metric static and ranks uncovered triples by page', () => {
  const coverage = computeJourneyCoverage({ coverage: coverageArtifact, journeys });
  expect(formatJourneyCoverage({ coverage })).toEqual([
    'Journey coverage (static, declared config): 3/6 triples, 50%',
    '  users (3 uncovered)',
    '    users_table onClick',
    '    refresh onClick',
    '    request get_users',
  ]);
});
