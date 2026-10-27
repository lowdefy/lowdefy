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

import { type } from '@lowdefy/helpers';

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Unpadded base64url (RFC 4648 section 5), written out because neither btoa nor
// Buffer is on every platform the core runs on.
function encodeBase64Url(bytes) {
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const chunk = (bytes[index] << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
    const characters = Math.min(bytes.length - index, 3) + 1;
    for (let position = 0; position < characters; position += 1) {
      encoded += BASE64URL_ALPHABET[(chunk >> (18 - position * 6)) & 63];
    }
  }
  return encoded;
}

function encodeAscii(text) {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

// A PKCE pair (RFC 7636, S256) for the sign-in sheet: the code verifier the
// shell keeps in memory and sends only to exchange the one-time token, and the
// code challenge that goes in the /auth/mobile URL. Pure: the shell passes the
// random bytes and its platform's SHA-256 (expo-crypto), so the core needs
// neither. 32 to 96 bytes make the 43 to 128 character verifier RFC 7636 asks
// for; a shell sends 64.
async function createPkceChallenge({ verifierBytes, sha256 }) {
  if (!(verifierBytes instanceof Uint8Array)) {
    throw new Error(
      `createPkceChallenge verifierBytes must be a Uint8Array. Received ${JSON.stringify(
        verifierBytes
      )}.`
    );
  }
  if (verifierBytes.length < 32 || verifierBytes.length > 96) {
    throw new Error(
      `createPkceChallenge verifierBytes must be 32 to 96 bytes long. Received ${verifierBytes.length}.`
    );
  }
  if (!type.isFunction(sha256)) {
    throw new Error('createPkceChallenge sha256 must be a function.');
  }
  const codeVerifier = encodeBase64Url(verifierBytes);
  const digest = await sha256(encodeAscii(codeVerifier));
  return {
    codeVerifier,
    codeChallenge: encodeBase64Url(new Uint8Array(digest)),
    codeChallengeMethod: 'S256',
  };
}

export default createPkceChallenge;
