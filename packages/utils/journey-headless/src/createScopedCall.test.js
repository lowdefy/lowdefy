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

import {
  bindCredentialScrub,
  markCredential,
  runInCredentialScope,
  scrubCredentials,
} from '@lowdefy/node-utils';

import createScopedCall from './createScopedCall.js';

const credentialScope = { bindScrub: bindCredentialScrub, run: runInCredentialScope };

test('createScopedCall runs a call in a credential scope, so the routine can mark a credential', async () => {
  const scopedCall = createScopedCall({
    credentialScope,
    onScope: () => undefined,
    run: async ({ token }) => {
      markCredential(token);
      return { status: 200, logged: scrubCredentials(`token ${token}`) };
    },
  });
  const answer = await scopedCall({ token: 'a-long-signing-secret' });
  expect(answer).toEqual({ status: 200, logged: 'token [REDACTED]' });
});

test('createScopedCall gives each call a scope of its own', async () => {
  const scopedCall = createScopedCall({
    credentialScope,
    onScope: () => undefined,
    run: async ({ mark, text }) => {
      if (mark) markCredential(text);
      return scrubCredentials(text);
    },
  });
  expect(await scopedCall({ mark: true, text: 'first-call-secret' })).toEqual('[REDACTED]');
  expect(await scopedCall({ mark: false, text: 'first-call-secret' })).toEqual('first-call-secret');
});

test('createScopedCall gives onScope a scrub that still scrubs what the call marked after it ends', async () => {
  const scrubs = [];
  const scopedCall = createScopedCall({
    credentialScope,
    onScope: (scrub) => scrubs.push(scrub),
    run: async () => {
      markCredential('a-long-signing-secret');
    },
  });
  await scopedCall({});
  expect(scrubs).toHaveLength(1);
  expect(scrubs[0]('Signing with a-long-signing-secret failed.')).toEqual(
    'Signing with [REDACTED] failed.'
  );
});
