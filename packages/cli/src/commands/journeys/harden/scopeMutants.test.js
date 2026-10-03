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
  },
  {
    id: 'form',
    operator: 'drop-block',
    anchor: { type: 'block', pageId: 'settings', blockId: 'form' },
  },
  {
    id: 'tab',
    operator: 'drop-block',
    anchor: { type: 'block', pageId: 'settings', blockId: 'tab' },
  },
  {
    id: 'app',
    operator: 'drop-action',
    anchor: { type: 'action', pageId: 'app', blockId: null, eventName: 'onInit' },
  },
  { id: 'step', operator: 'drop-step', anchor: { type: 'endpoint', endpointId: 'notify' } },
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
