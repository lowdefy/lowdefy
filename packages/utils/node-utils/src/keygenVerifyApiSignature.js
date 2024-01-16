/*
  Copyright 2020-2024 Lowdefy, Inc

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
import crypto from 'crypto';

async function keygenVerifyApiSignature({ body, config, date, signatureHeader, target }) {
  if (signatureHeader == null) {
    throw new Error('Signature was expected but is missing'); // TODO
  }

  const [, signature] = signatureHeader.match(/signature="(.*)",/i);

  const sha256 = crypto.createHash('sha256').update(body);
  const digest = `sha-256=${sha256.digest('base64')}`;

  // Rebuild the signing data
  const data = [
    `(request-target): ${target}`,
    `host: api.keygen.sh`,
    `date: ${date}`,
    `digest: ${digest}`,
  ].join('\n');

  // Decode DER verify key
  const verifyKey = crypto.createPublicKey({
    key: Buffer.from(config.publicKey, 'base64'),
    format: 'der',
    type: 'spki',
  });

  // Convert into bytes
  const signatureBytes = Buffer.from(signature, 'base64');
  const dataBytes = Buffer.from(data);

  // Cryptographically verify data against the signature
  const ok = crypto.verify(null, dataBytes, verifyKey, signatureBytes);
  if (!ok) {
    throw new Error(`Signature does not match: ${signature}`); // TODO
  }
}

export default keygenVerifyApiSignature;
