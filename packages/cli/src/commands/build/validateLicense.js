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

import path from 'path';
import { keygenGetLicense } from '@lowdefy/node-utils';


async function validateLicense({ context }) {
  const license = await keygenGetLicense({
    config: config['dev'],
    offlineFilePath: path.join(context.directories.config, 'license.lic'),
  });

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
