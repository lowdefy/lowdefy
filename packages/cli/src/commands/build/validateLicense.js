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

import { keygenValidateLicense } from '@lowdefy/node-utils';

const config = {
  dev: {
    accountId: 'bf35f4ae-53a8-45c6-9eed-2d1fc9f53bd6',
    productId: '4254760d-e760-4932-bb96-ba767e6ae780',
    publicKey: 'MCowBQYDK2VwAyEAN27y1DiHiEDYFbNGjgfFdWygxrVSetq6rApWq3psJZI=',
  },
  prod: {
    accountId: '',
    productId: '',
    publicKey: '',
  },
};

// TODO: Name here
async function validateLicense({ context }) {
  const license = await keygenValidateLicense({ config: config['dev'] });

  if (license.code == 'NO_LICENSE') {
    throw new Error('License is required.'); // TODO
  }

  if (!['VALID', 'EXPIRED'].includes(license.code)) {
    throw new Error('Invalid license.'); // TODO
  }

  if (license.code == 'EXPIRED') {
    if (license?.expiry.valueOf?.() < Date.now() - 1000 * 60 * 60 * 24 * 31) {
      throw new Error('License is expired.'); // TODO
    }
    context.print.warn('License is expired.'); // TODO
  }

  if (license.entitlements.includes('PAID')) {
    return {
      packageName: '@lowdefy/server-enterprise',
      license,
    };
  }
  return {
    packageName: '@lowdefy/server-community',
    license,
  };
}

export default validateLicense;
