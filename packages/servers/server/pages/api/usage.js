/*
  Copyright 2020-2026 Lowdefy, Inc

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

// TODO
// import crypto from 'crypto';

import appJson from '../../lib/build/app.js';
import packageJson from '../../package.json';
import apiWrapper from '../../lib/server/apiWrapper.js';
// import validateLicense from '../../lib/server/validateLicense.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const { user, machine } = req.body;
  const host = req.headers.host;
  context.logger.info({ event: 'log_usage', user, machine });

  // const license = await validateLicense();
  // if (license.entitlements.includes['OFFLINE']) {
  //   return res.status(200).json({ offline: true });
  // }
  const timestamp = Date.now();

  // const data = [
  //   `git_sha: ${appJson.git_sha}`,
  //   `host: ${host}`,
  //   `license_key: ${license.id}`,
  //   `machine: ${machine}`,
  //   `timestamp: ${timestamp}`,
  //   `user: ${user}`,
  //   `version: ${packageJson.version}`,
  // ].join('\n');

  // const hmac = crypto.createHmac('sha256', process.env.LOWDEFY_LICENSE_KEY ?? 'NO_LICENSE');
  // hmac.update(data);
  // const sig = hmac.digest('base64');

  return res.status(200).json({
    offline: false,
    data: {
      git_sha: appJson.git_sha,
      host,
      // license_key: license.id,
      machine,
      // sig,
      timestamp,
      user,
      version: packageJson.version,
    },
  });
}

export default apiWrapper(handler);
