/*
  Copyright 2020-2023 Lowdefy, Inc

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
import { readFile } from '@lowdefy/node-utils';

async function getOfflineLicense({ config, offlineFilePath }) {
  const licenseFileContent = await readFile(offlineFilePath);

  if (!licenseFileContent) {
    return null;
  }

  const trimmed = licenseFileContent
    .replace('-----BEGIN LICENSE FILE-----\n', '')
    .replace('-----END LICENSE FILE-----\n');

  const parsed = JSON.parse(Buffer.from(trimmed, 'base64'));

  if (!parsed.alg === 'base64+ed25519') {
    throw new Error('Invalid Alg.');
  }

  const verifyKey = crypto.createPublicKey({
    format: 'der',
    type: 'spki',
    key: Buffer.from(config.publicKey, 'base64'),
  });

  const verified = crypto.verify(
    null,
    `license/${parsed.enc}`,
    verifyKey,
    Buffer.from(parsed.sig, 'base64')
  );

  if (!verified) {
    throw new Error('Invalid license.'); // TODO:
  }

  const data = JSON.parse(Buffer.from(parsed.enc, 'base64'));

  // TODO: Verify account and product

  // TODO: What if there is no expiry?
  const expiry = data?.meta?.expiry ? new Date(data?.meta?.expiry) : undefined;
  return {
    id: data?.data?.id,
    code: expiry && expiry.valueOf() < Date.now() ? 'EXPIRED' : 'VALID',
    entitlements: (data?.included ?? [])
      .filter((i) => i.type === 'entitlements')
      .map((i) => i.attributes.code),
    expiry: expiry,
  };
}

export default getOfflineLicense;
