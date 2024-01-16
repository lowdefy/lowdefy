/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/
import crypto from 'crypto';

import appJson from '../../build/app.json';
import packageJson from '../../package.json';
import apiWrapper from '../../lib/server/apiWrapper.js';
import validateLicense from '../../lib/server/validateLicense.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const { user, machine } = req.body;
  const host = req.headers.host;
  context.logger.info({ event: 'log_usage', user, machine });

  const license = await validateLicense();
  if (license.entitlements.includes['OFFLINE']) {
    return res.status(200).json({ offline: true });
  }
  const timestamp = Date.now();

  const data = [
    `git_sha: ${appJson.git_sha}`,
    `host: ${host}`,
    `license_key: ${license.id}`,
    `machine: ${machine}`,
    `timestamp: ${timestamp}`,
    `user: ${user}`,
    `version: ${packageJson.version}`,
  ].join('\n');

  const hmac = crypto.createHmac('sha256', process.env.LOWDEFY_LICENSE_KEY ?? 'NO_LICENSE');
  hmac.update(data);
  const sig = hmac.digest('base64');

  return res.status(200).json({
    offline: false,
    data: {
      git_sha: appJson.git_sha,
      host,
      license_key: license.id,
      machine,
      sig,
      timestamp,
      user,
      version: packageJson.version,
    },
  });
}

export default apiWrapper(handler);
