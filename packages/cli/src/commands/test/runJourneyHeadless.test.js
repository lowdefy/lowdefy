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

import { vi, expect, test } from 'vitest';

const mockCreateBuildHost = vi.fn();
const mockRunHeadlessJourney = vi.fn();
vi.mock('@lowdefy/journey-headless', () => ({
  createBuildHost: mockCreateBuildHost,
  runHeadlessJourney: mockRunHeadlessJourney,
}));

const context = { directories: { config: '/app' } };
const filePath = '/app/tests/journeys/orders.yaml';

test('runJourneyHeadless refuses a journey with an unknown root key without opening a host', async () => {
  const { default: runJourneyHeadless } = await import('./runJourneyHeadless.js');
  const journey = {
    name: 'lists orders',
    data: 'orders',
    seriel: true,
    steps: [{ call: { endpoint: 'orders-list' } }, { expect: { status: 200 } }],
  };
  const result = await runJourneyHeadless({ app: {}, context, item: { filePath, journey } });
  expect(result).toEqual({
    name: 'lists orders',
    filePath,
    passed: false,
    refused: true,
    stepCount: 0,
    durationMs: 0,
    message:
      'Invalid journey file: Journey has an unknown key "seriel". Keys are: name, description, pageId, data, user, pathParams, urlQuery, tags, variant, timeout, deprecated, serial, evidence, cases, stubs, steps.',
  });
  expect(mockCreateBuildHost).not.toHaveBeenCalled();
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
});
