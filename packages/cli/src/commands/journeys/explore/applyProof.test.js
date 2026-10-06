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

import applyProof from './applyProof.js';

function finding(key, kind) {
  return { key, kind, pageId: 'ticket', walks: ['walk-1'], users: ['member'] };
}

test('applyProof lists proven findings first (errors, dead clicks, role refusals), then not-proven ones by reason', () => {
  const findings = [
    finding('dead-1', 'dead-click'),
    finding('refused', 'role-refused'),
    finding('flaky', 'server-error'),
    finding('error', 'action-error'),
    finding('search', 'environment'),
    finding('dead-2', 'dead-click'),
    finding('request', 'request-failed'),
  ];
  const proof = {
    proven: [
      { key: 'dead-1', path: '/app/tests/journeys/_candidates/explorer/run/findings/a.yaml' },
      { key: 'refused', path: '/app/tests/journeys/_candidates/explorer/run/findings/b.yaml' },
      { key: 'error', path: '/app/tests/journeys/_candidates/explorer/run/findings/c.yaml' },
      { key: 'request', path: '/app/tests/journeys/_candidates/explorer/run/findings/d.yaml' },
    ],
    notProven: [
      { key: 'flaky', reason: 'not-reproduced' },
      { key: 'search', reason: 'environment' },
      { key: 'dead-2', reason: 'no-candidate' },
    ],
  };
  const applied = applyProof({ findings, proof, configDirectory: '/app' });
  expect(applied.map(({ key, status, reason }) => [key, status, reason])).toEqual([
    ['error', 'proven', undefined],
    ['request', 'proven', undefined],
    ['dead-1', 'proven', undefined],
    ['refused', 'proven', undefined],
    ['flaky', 'not-proven', 'not-reproduced'],
    ['search', 'not-proven', 'environment'],
    ['dead-2', 'not-proven', 'no-candidate'],
  ]);
  expect(applied[0].candidate).toBe('tests/journeys/_candidates/explorer/run/findings/c.yaml');
});
