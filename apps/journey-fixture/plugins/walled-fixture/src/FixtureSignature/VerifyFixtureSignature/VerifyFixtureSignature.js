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

import crypto from 'node:crypto';

// A webhook verify gate, as an app's own would be: the signature header is the hex HMAC-SHA256 of
// the raw body under the secret, compared in constant time.
async function VerifyFixtureSignature({ request }) {
  const expected = Buffer.from(
    crypto.createHmac('sha256', request.secret).update(request.rawBody).digest('hex'),
    'utf8'
  );
  const signature = Buffer.from(request.signature ?? '', 'utf8');
  return signature.length === expected.length && crypto.timingSafeEqual(signature, expected);
}

VerifyFixtureSignature.schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - VerifyFixtureSignature',
  type: 'object',
  required: ['secret', 'rawBody'],
  properties: {
    secret: { type: 'string', description: 'The secret the sender signs with.' },
    rawBody: { type: 'string', description: 'The request body exactly as it was posted.' },
    signature: {
      type: ['string', 'null'],
      description: 'The signature header the sender sent, if any.',
    },
  },
};
VerifyFixtureSignature.meta = { checkRead: false, checkWrite: false };

export default VerifyFixtureSignature;
