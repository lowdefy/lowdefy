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

import toWebhookBody from './toWebhookBody.js';

test('toWebhookBody sends a string as written', () => {
  expect(toWebhookBody('id=evt_1&type=paid')).toBe('id=evt_1&type=paid');
  expect(toWebhookBody('{"id": "evt_1"}')).toBe('{"id": "evt_1"}');
});

test('toWebhookBody sends anything else as JSON text', () => {
  expect(toWebhookBody({ id: 'evt_1', amount: 10 })).toBe('{"id":"evt_1","amount":10}');
  expect(toWebhookBody([1, 2])).toBe('[1,2]');
  expect(toWebhookBody(null)).toBe('null');
  expect(toWebhookBody(5)).toBe('5');
});
