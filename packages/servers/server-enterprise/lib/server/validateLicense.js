/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
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

let license;

async function validateLicense() {
  if (license) {
    // Check cached license every 24 hours
    if (license?.timestamp?.valueOf?.() > Date.now() - 1000 * 60 * 60 * 24) {
      return license;
    }
  }
  license = await keygenValidateLicense({
    config: config[process.env.LOWDEFY_LICENSE_ENV ?? 'prod'],
  });
  return license;
}

export default validateLicense;
