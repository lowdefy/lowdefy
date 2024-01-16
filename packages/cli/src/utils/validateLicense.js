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

import { keygenValidateLicense } from '@lowdefy/node-utils';

const config = {
  dev: {
    accountId: 'bf35f4ae-53a8-45c6-9eed-2d1fc9f53bd6',
    productId: '4254760d-e760-4932-bb96-ba767e6ae780',
    publicKey: 'MCowBQYDK2VwAyEAN27y1DiHiEDYFbNGjgfFdWygxrVSetq6rApWq3psJZI=',
  },
  prod: {
    accountId: '63b3d4e4-39e1-4ccc-8c58-6b8f97ddf4fa',
    productId: 'd19a5af0-4147-4a65-8b6d-0706d7804bc1',
    publicKey: 'MCowBQYDK2VwAyEAFPoseE3gi+YsJziigc1kFKOkdUIBiUMd9RZujTh23Fc=',
  },
};

// TODO: Messages
async function validateLicense({ print }) {
  const license = await keygenValidateLicense({
    config: config[process.env.LOWDEFY_LICENSE_ENV ?? 'prod'],
  });

  if (license.code == 'NO_LICENSE') {
    return license;
  }

  if (license.code == 'EXPIRED') {
    print.warn(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Your Lowdefy license has expired.                ┃
┠──────────────────────────────────────────────────┨
┃ Please renew your license at                     ┃
┃ https://cloud.lowdefy.com                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    return license;
  }
  if (license.code == 'NO_LICENSE') {
    return license;
  }

  if (license.code !== 'VALID') {
    throw new Error('Invalid license.');
  }

  return license;
}

export default validateLicense;
