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

import carryOverVerdicts from './carryOverVerdicts.js';

function exercised(pageId) {
  return {
    pages: [pageId],
    appEvents: true,
    requests: [],
    endpoints: [],
    events: [],
    rendered: {},
  };
}

const oldBaselines = [
  { key: 'orders', exercised: exercised('orders') },
  { key: 'refunds', exercised: exercised('refunds') },
];

const oldEnumeration = {
  artifacts: { 'pages/orders.json': 'o1', 'pages/refunds.json': 'r1', 'events.json': 'e1' },
  mutants: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
};

test('carryOverVerdicts keeps verdicts whose journeys read no changed artifact, requeues the rest and names vanished mutants', () => {
  const newEnumeration = {
    artifacts: { 'pages/orders.json': 'o1', 'pages/refunds.json': 'r2', 'events.json': 'e1' },
    mutants: [{ id: 'm1' }, { id: 'm2' }],
  };
  const result = carryOverVerdicts({
    verdicts: [
      { mutantId: 'm1', journey: 'orders', verdict: 'killed' },
      { mutantId: 'm1', journey: 'refunds', verdict: 'survived' },
      { mutantId: 'm2', journey: 'orders', verdict: 'survived' },
      { mutantId: 'm3', journey: 'orders', verdict: 'killed' },
    ],
    oldEnumeration,
    newEnumeration,
    oldBaselines,
    newBaselines: oldBaselines,
  });
  expect(result).toEqual({
    kept: [
      { mutantId: 'm1', journey: 'orders', verdict: 'killed' },
      { mutantId: 'm2', journey: 'orders', verdict: 'survived' },
    ],
    requeue: [{ mutantId: 'm1', journey: 'refunds' }],
    gone: ['m3'],
  });
});

test('carryOverVerdicts requeues a journey whose new baseline reaches an artifact that changed', () => {
  const newEnumeration = {
    artifacts: { ...oldEnumeration.artifacts, 'pages/settings.json': 's1' },
    mutants: oldEnumeration.mutants,
  };
  const result = carryOverVerdicts({
    verdicts: [{ mutantId: 'm1', journey: 'orders', verdict: 'killed' }],
    oldEnumeration,
    newEnumeration,
    oldBaselines,
    newBaselines: [
      {
        key: 'orders',
        exercised: { ...exercised('orders'), pages: ['orders', 'settings'] },
      },
    ],
  });
  expect(result.requeue).toEqual([{ mutantId: 'm1', journey: 'orders' }]);
});

test('carryOverVerdicts requeues the verdicts of a journey with no new baseline', () => {
  const result = carryOverVerdicts({
    verdicts: [{ mutantId: 'm1', journey: 'orders', verdict: 'killed' }],
    oldEnumeration,
    newEnumeration: oldEnumeration,
    oldBaselines,
    newBaselines: [],
  });
  expect(result).toEqual({ kept: [], requeue: [{ mutantId: 'm1', journey: 'orders' }], gone: [] });
});
