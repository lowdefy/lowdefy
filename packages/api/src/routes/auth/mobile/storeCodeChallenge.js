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

import getOneTimeTokenIdentifiers from './getOneTimeTokenIdentifiers.js';

// Binds a one-time token to the shell's PKCE code challenge, for the code
// verifier check on /one-time-token/verify (createCodeVerifierCheck). It
// expires with the token, a minute after minting (buildOneTimeTokenPlugin).
async function storeCodeChallenge({ auth, codeChallenge, token }) {
  const { internalAdapter } = await auth.$context;
  await internalAdapter.createVerificationValue({
    identifier: getOneTimeTokenIdentifiers({ token }).challenge,
    value: codeChallenge,
    expiresAt: new Date(Date.now() + 60 * 1000),
  });
}

export default storeCodeChallenge;
