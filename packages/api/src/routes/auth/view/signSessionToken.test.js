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

import { createHmac } from 'node:crypto';
import { expect, test } from 'vitest';

import signSessionToken from './signSessionToken.js';

test('signSessionToken joins the token and its base64 HMAC-SHA256 with a dot, URI-encoded', () => {
  const signature = createHmac('sha256', 'secret').update('tok').digest('base64');
  const signed = signSessionToken({ secret: 'secret', token: 'tok' });
  expect(decodeURIComponent(signed)).toBe(`tok.${signature}`);
  expect(signed).not.toContain('=');
});

test('signSessionToken signs with the secret it is given', () => {
  expect(signSessionToken({ secret: 'a', token: 'tok' })).not.toBe(
    signSessionToken({ secret: 'b', token: 'tok' })
  );
});
