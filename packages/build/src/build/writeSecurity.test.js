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

import { vi, beforeEach, expect, test } from 'vitest';

import writeSecurity from './writeSecurity.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = vi.fn();

function createContext(security) {
  const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });
  context.security = security;
  return context;
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeSecurity writes security.json with the policy off', async () => {
  await writeSecurity({ context: createContext({ contentSecurityPolicy: null }) });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['security.json', '{"contentSecurityPolicy":null}'],
  ]);
});

test('writeSecurity writes the resolved policy', async () => {
  const contentSecurityPolicy = {
    reportOnly: true,
    directives: { 'default-src': ["'self'"] },
    nonceDirectives: ['script-src'],
    websockets: false,
  };
  await writeSecurity({ context: createContext({ contentSecurityPolicy }) });
  expect(JSON.parse(mockWriteBuildArtifact.mock.calls[0][1])).toEqual({ contentSecurityPolicy });
});
