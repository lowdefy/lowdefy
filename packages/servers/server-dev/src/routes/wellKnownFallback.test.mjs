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

import { jest } from '@jest/globals';

import wellKnownFallbackHandler from './wellKnownFallback.js';

test('an unserved well-known path answers 404 JSON, never the app shell', () => {
  const json = jest.fn((data, status) => ({ data, status }));
  const result = wellKnownFallbackHandler({
    req: { path: '/.well-known/oauth-protected-resource' },
    json,
  });
  expect(result.status).toBe(404);
  expect(result.data).toEqual({
    name: 'NotFoundError',
    message: 'No well-known document at /.well-known/oauth-protected-resource.',
  });
});
