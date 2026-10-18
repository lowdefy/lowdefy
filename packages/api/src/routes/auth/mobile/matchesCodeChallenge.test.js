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

import matchesCodeChallenge from './matchesCodeChallenge.js';

// RFC 7636 appendix B.
const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

test('matchesCodeChallenge accepts the verifier the challenge was made from', () => {
  expect(matchesCodeChallenge({ codeChallenge, codeVerifier })).toBe(true);
});

test.each([
  ['another verifier', { codeChallenge, codeVerifier: `${codeVerifier.slice(0, -1)}A` }],
  ['the challenge as its own verifier', { codeChallenge, codeVerifier: codeChallenge }],
  ['no verifier', { codeChallenge }],
  ['a verifier that is not a string', { codeChallenge, codeVerifier: 42 }],
  ['no challenge', { codeVerifier }],
  ['a verifier shorter than 43 characters', { codeChallenge, codeVerifier: 'short' }],
  ['a verifier longer than 128 characters', { codeChallenge, codeVerifier: 'a'.repeat(129) }],
  [
    'a verifier with characters RFC 7636 does not allow',
    { codeChallenge, codeVerifier: `${codeVerifier.slice(0, -1)}+` },
  ],
])('matchesCodeChallenge refuses %s', (_, input) => {
  expect(matchesCodeChallenge(input)).toBe(false);
});
