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
    run: async ({ token }) => {
      markCredential(token);
      return {
        status: 200,
        response: { token },
        faults: [],
        logged: scrubCredentials(`token ${token}`),
      };
    },
  });
  const answer = await scopedCall({ token: 'a-long-signing-secret' });
  expect(answer.status).toEqual(200);
  expect(answer.response).toEqual({ token: 'a-long-signing-secret' });
  expect(answer.logged).toEqual('token [REDACTED]');
});

test('createScopedCall gives each call a scope of its own', async () => {
  const scopedCall = createScopedCall({
    credentialScope,
    run: async ({ mark, text }) => {
      if (mark) markCredential(text);
      return { faults: [], logged: scrubCredentials(text) };
    },
  });
  expect((await scopedCall({ mark: true, text: 'first-call-secret' })).logged).toEqual(
    '[REDACTED]'
  );
  expect((await scopedCall({ mark: false, text: 'first-call-secret' })).logged).toEqual(
    'first-call-secret'
  );
});

test('createScopedCall scrubs the credentials the call marked from its faults', async () => {
  const scopedCall = createScopedCall({
    credentialScope,
    run: async () => {
      markCredential('a-long-signing-secret');
      return { faults: [new Error('Signing with a-long-signing-secret failed.')] };
    },
  });
  const { faults } = await scopedCall({});
  expect(faults[0].message).toEqual('Signing with [REDACTED] failed.');
  expect(faults[0].stack).not.toContain('a-long-signing-secret');
});
