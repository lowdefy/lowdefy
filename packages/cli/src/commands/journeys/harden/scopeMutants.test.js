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

import scopeMutants from './scopeMutants.js';

function exercised({ pages, endpoints = [], events = [], rendered = {} }) {
  return { pages, appEvents: true, requests: [], endpoints, events, rendered };
}

const baselines = [
  {
    key: 'tests/journeys/a.yaml#a',
    exercised: exercised({
      pages: ['tickets'],
      endpoints: [{ endpointId: 'notify', calls: 1 }],
      rendered: { tickets: ['grid'] },
    }),
  },
  {
    key: 'tests/journeys/b.yaml#b',
    exercised: exercised({ pages: ['settings'], rendered: { settings: ['form'] } }),
  },
];

const mutants = [
  {
    id: 'grid',
    operator: 'drop-block',
    anchor: { type: 'block', pageId: 'tickets', blockId: 'grid' },
    copyTargets: [],
  },
  {
    id: 'form',
    operator: 'drop-block',
    anchor: { type: 'block', pageId: 'settings', blockId: 'form' },
    copyTargets: [],
  },
  {
    id: 'tab',
    operator: 'drop-block',
    anchor: { type: 'block', pageId: 'settings', blockId: 'tab' },
    copyTargets: [],
  },
  {
    id: 'app',
    operator: 'drop-action',
    anchor: { type: 'action', pageId: 'app', blockId: null, eventName: 'onInit' },
    copyTargets: [],
  },
  {
    id: 'step',
    operator: 'drop-step',
    anchor: { type: 'endpoint', endpointId: 'notify' },
    copyTargets: [],
  },
];

test('scopeMutants pairs mutants with the journeys on their path, an app-event mutant with every journey', () => {
  const { onPath, notExercised } = scopeMutants({ mutants, baselines });
  expect(onPath.map(({ id, journeys }) => [id, journeys])).toEqual([
    ['grid', ['tests/journeys/a.yaml#a']],
    ['form', ['tests/journeys/b.yaml#b']],
    ['app', ['tests/journeys/a.yaml#a', 'tests/journeys/b.yaml#b']],
    ['step', ['tests/journeys/a.yaml#a']],
  ]);
  expect(notExercised).toBe(1);
});

test('scopeMutants --page keeps that page and the endpoints its journeys called, and drops app events', () => {
  const { onPath } = scopeMutants({ mutants, baselines, pages: ['tickets'] });
  expect(onPath.map(({ id }) => id)).toEqual(['grid', 'step']);
});

test('scopeMutants --operators keeps only the named operators', () => {
  const { onPath } = scopeMutants({ mutants, baselines, operators: ['drop-step'] });
  expect(onPath.map(({ id }) => id)).toEqual(['step']);
});

// A shared layout block, kept on "a-home" (first by page id) with a copy on
// tickets, which journey a renders.
const sharedFooter = {
  id: 'footer',
  operator: 'drop-block',
  artifact: 'pages/a-home.json',
  key: 'k_home',
  anchor: { type: 'block', pageId: 'a-home', blockId: 'footer', parentBlockId: 'a-home' },
  copies: ['tickets'],
  copyTargets: [
    {
      artifact: 'pages/tickets.json',
      key: 'k_tickets',
      anchor: { type: 'block', pageId: 'tickets', blockId: 'footer', parentBlockId: 'tickets' },
    },
  ],
};

const footerBaselines = [
  {
    key: 'tests/journeys/a.yaml#a',
    exercised: exercised({ pages: ['tickets'], rendered: { tickets: ['footer'] } }),
  },
  baselines[1],
];

test('scopeMutants pairs a shared layout mutant with a journey that renders it only on a copy page', () => {
  const { onPath, notExercised } = scopeMutants({
    mutants: [sharedFooter],
    baselines: footerBaselines,
  });
  expect(onPath.map(({ id, journeys }) => [id, journeys])).toEqual([
    ['footer', ['tests/journeys/a.yaml#a']],
  ]);
  expect(notExercised).toBe(0);
});

test('scopeMutants --page keeps a shared layout mutant when a copy is on a named page', () => {
  expect(
    scopeMutants({ mutants: [sharedFooter], baselines: footerBaselines, pages: ['tickets'] }).onPath
  ).toHaveLength(1);
  expect(
    scopeMutants({ mutants: [sharedFooter], baselines: footerBaselines, pages: ['settings'] })
      .onPath
  ).toHaveLength(0);
});
