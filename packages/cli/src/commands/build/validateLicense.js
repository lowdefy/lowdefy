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

// TODO: Messages
async function validateLicense({ context }) {
  // TODO: env
  const license = await keygenValidateLicense({ config: config['dev'] });

  if (license.code == 'EXPIRED') {
    context.print.warn('License is expired.');
    return license;
  }
  if (license.code == 'NO_LICENSE') {
    context.print.warn('No license.');
    return license;
  }

  if (license.code !== 'VALID') {
    throw new Error('Invalid license.');
  }

  return license;
}

export default validateLicense;
