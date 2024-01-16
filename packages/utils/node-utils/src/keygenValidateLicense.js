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
import keygenValidateLicenseOffline from './keygenValidateLicenseOffline.js';
import keygenVerifyApiSignature from './keygenVerifyApiSignature.js';

async function keygenValidateLicense({ config }) {
  const licenseKey = process.env.LOWDEFY_LICENSE_KEY;
  let entitlements = [];

  if (!config) {
    throw new Error('License server config is not defined.');
  }

  // TODO: Return this or undefined/null?
  if (!licenseKey) {
    return {
      id: 'NO_LICENSE',
      code: 'NO_LICENSE',
      entitlements,
      metadata: {},
      timestamp: new Date(),
    };
  }

  if (licenseKey.startsWith('key/')) {
    const offlineLicense = await keygenValidateLicenseOffline({
      config,
      licenseKey,
    });
    if (offlineLicense.entitlements.includes('OFFLINE')) {
      return offlineLicense;
    }
  }

  const nonce = crypto.randomInt(1_000_000_000_000);
  const res = await fetch(
    `https://api.keygen.sh/v1/accounts/${config.accountId}/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        meta: {
          key: licenseKey,
          nonce,
          scope: {
            product: config.productId,
          },
        },
      }),
    }
  );

  const body = await res.text();
  const { meta, data, errors } = JSON.parse(body);
  if (meta.nonce !== nonce) {
    return {
      id: 'INVALID_LICENSE',
      code: 'INVALID_LICENSE',
      entitlements,
      metadata: {},
      timestamp: new Date(),
    };
  }
  if (errors) {
    return {
      id: 'INVALID_LICENSE',
      code: 'INVALID_LICENSE',
      entitlements,
      metadata: {},
      timestamp: new Date(),
    };
  }

  await keygenVerifyApiSignature({
    body,
    config,
    date: res.headers.get('date'),
    signatureHeader: res.headers.get('keygen-signature'),
    target: `post /v1/accounts/${config.accountId}/licenses/actions/validate-key`,
  });

  if (data?.relationships?.entitlements?.links?.related) {
    const entitlementResponse = await (
      await fetch(`https://api.keygen.sh/${data.relationships.entitlements.links.related}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
          Authorization: `License ${licenseKey}`,
        },
      })
    ).json();
    entitlements = (entitlementResponse?.data ?? []).map((ent) => ent?.attributes?.code);
  }
  return {
    id: data?.id,
    code: meta?.code,
    entitlements,
    expiry: data?.attributes?.expiry ? new Date(data?.attributes?.expiry) : undefined,
    metadata: data?.attributes?.metadata,
    timestamp: new Date(), // TODO: timestamp, validated, validated_at, validated_ts?
  };
}

export default keygenValidateLicense;
