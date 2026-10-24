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

import createCodeVerifierCheck from './createCodeVerifierCheck.js';
import getOneTimeTokenIdentifiers from './getOneTimeTokenIdentifiers.js';

// RFC 7636 appendix B.
const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
const identifiers = getOneTimeTokenIdentifiers({ token: 'one-time' });

function createCtx({ body, challenge = { value: codeChallenge } }) {
  const internalAdapter = {
    consumeVerificationValue: vi.fn(async (identifier) =>
      identifier === identifiers.challenge ? challenge : { value: 'session-token' }
    ),
  };
  return { ctx: { body, context: { internalAdapter } }, internalAdapter };
}

test('createCodeVerifierCheck lets the exchange through with the matching verifier', async () => {
  const { ctx, internalAdapter } = createCtx({
    body: { token: 'one-time', code_verifier: codeVerifier },
  });
  expect(await createCodeVerifierCheck()(ctx)).toBeUndefined();
  expect(internalAdapter.consumeVerificationValue.mock.calls).toEqual([[identifiers.challenge]]);
});

test.each([
  ['no verifier', { body: { token: 'one-time' } }],
  ['the wrong verifier', { body: { token: 'one-time', code_verifier: 'x'.repeat(43) } }],
  [
    'a token with no stored challenge',
    { body: { token: 'one-time', code_verifier: codeVerifier }, challenge: null },
  ],
])('createCodeVerifierCheck refuses %s and burns the token', async (_, input) => {
  const { ctx, internalAdapter } = createCtx(input);
  const error = await createCodeVerifierCheck()(ctx).catch((caught) => caught);
  expect(error.statusCode).toBe(400);
  expect(error.body.message).toBe('Invalid token');
  expect(internalAdapter.consumeVerificationValue.mock.calls).toEqual([
    [identifiers.challenge],
    [identifiers.token],
  ]);
});

test('createCodeVerifierCheck leaves a missing token to the route', async () => {
  const { ctx, internalAdapter } = createCtx({ body: {} });
  expect(await createCodeVerifierCheck()(ctx)).toBeUndefined();
  expect(internalAdapter.consumeVerificationValue).not.toHaveBeenCalled();
});
