/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import NextAuth from 'next-auth';

import apiWrapper from '../../../lib/server/apiWrapper.js';
import authJson from '../../../build/auth.json';

async function handler({ context, req, res }) {
  if (authJson.configured === true) {
    // Required for emails in corporate networks, see:
    // https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return await NextAuth(req, res, context.authOptions);
  }

  return res.status(404).json({
    message: 'Auth not configured',
  });
}

export default apiWrapper(handler);
