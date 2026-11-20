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

import toWebhookHeaders from './toWebhookHeaders.js';

test('toWebhookHeaders lower-cases header names and keeps their values', () => {
  expect(toWebhookHeaders({ 'X-Fixture-Signature': 'AbC', 'content-type': 'text/plain' })).toEqual({
    'x-fixture-signature': 'AbC',
    'content-type': 'text/plain',
  });
});

test('toWebhookHeaders answers no headers for none', () => {
  expect(toWebhookHeaders(undefined)).toEqual({});
});
