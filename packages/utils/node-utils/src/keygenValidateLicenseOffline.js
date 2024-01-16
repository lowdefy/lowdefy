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

async function keygenValidateLicenseOffline({ config, licenseKey }) {
  const [data, signature] = licenseKey.split('.');

  const [prefix, enc] = data.split('/');
  if (prefix !== 'key') {
    throw new Error(`Unsupported prefix '${prefix}'`);
  }

  const verifyKey = crypto.createPublicKey({
    format: 'der',
    type: 'spki',
    key: Buffer.from(config.publicKey, 'base64'),
  });

  const signatureBytes = Buffer.from(signature, 'base64');
  const dataBytes = Buffer.from(data);

  const ok = crypto.verify(null, dataBytes, verifyKey, signatureBytes);
  if (!ok) {
    throw new Error('TODO');
  }

  const decoded = JSON.parse(Buffer.from(enc, 'base64'));
  const expiry = new Date(decoded.expiry);

  if (decoded.product !== config.productId) {
    return {
      id: 'INVALID_LICENSE',
      code: 'INVALID_LICENSE',
      entitlements: [],
      metadata: {},
      timestamp: new Date(),
    };
  }

  return {
    id: decoded.id,
    code: expiry.valueOf() < Date.now() ? 'EXPIRED' : 'VALID',
    entitlements: decoded.entitlements,
    expiry: expiry,
    metadata: decoded.metadata,
    timestamp: new Date(),
  };
}

export default keygenValidateLicenseOffline;
