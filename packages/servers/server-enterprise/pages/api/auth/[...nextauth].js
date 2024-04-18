/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import NextAuth from 'next-auth';

import apiWrapper from '../../../lib/server/apiWrapper.js';
import authJson from '../../../build/auth.json';
import createLicenseRedirectCallback from '../../../lib/server/auth/createLicenseRedirectCallback.js';
import validateLicense from '../../../lib/server/validateLicense.js';
import checkAuthorizedHost from '../../../lib/server/checkAuthorizedHost.js';

async function handler({ context, req, res }) {
  if (authJson.configured !== true) {
    return res.status(404).json({
      message: 'Auth not configured',
    });
  }
  // Required for emails in corporate networks, see:
  // https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  if (req.url.startsWith('/api/auth/callback')) {
    const license = await validateLicense(context);
    const authorizedHost = checkAuthorizedHost({ license, req });
    if (!authorizedHost) {
      throw new Error('Domain not authorized to use license.');
    }
    context.authOptions.callbacks.redirect = createLicenseRedirectCallback(context, license);
  } else {
    context.authOptions.callbacks.redirect = context.authOptions.originalRedirectCallback;
  }
  return NextAuth(req, res, context.authOptions);
}

export default apiWrapper(handler);
