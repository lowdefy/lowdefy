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
import keygenGetLicenseFile from './keygenGetLicenseFile.js';

async function keygenGetLicense({ config, offlineFilePath }) {
  const offline = await keygenGetLicenseFile({
    config,
    offlineFilePath,
  });

  if (offline) {
    return offline;
  }

  const licenseKey = process.env.LOWDEFY_LICENSE_KEY;
  let entitlements = [];

  // TODO: Return this of undefined/null?
  if (!licenseKey) {
    return {
      code: 'NO_LICENSE',
      entitlements,
    };
  }

  const nonce = crypto.randomInt(1_000_000_000_000);
  const response = await (
    await fetch(
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
    )
  ).json();

  // TODO: Validate signature

  if (response.meta.nonce !== nonce) {
    throw new Error('License validation failed.');
  }

  if (response?.data?.relationships?.entitlements?.links?.related) {
    const entitlementResponse = await (
      await fetch(
        `https://api.keygen.sh/${response.data.relationships.entitlements.links.related}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'application/vnd.api+json',
            Authorization: `License ${licenseKey}`,
          },
        }
      )
    ).json();
    entitlements = (entitlementResponse?.data ?? []).map((ent) => ent?.attributes?.code);
  }
  return {
    id: response?.data?.id,
    code: response?.meta?.code,
    entitlements,
    expiry: response?.data?.attributes?.expiry
      ? new Date(response?.data?.attributes?.expiry)
      : undefined,
  };
}

export default keygenGetLicense;
