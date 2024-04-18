/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/
import apiWrapper from '../../lib/server/apiWrapper.js';
import validateLicense from '../../lib/server/validateLicense.js';

async function handler({ req, res }) {
  if (req.method !== 'GET') {
    throw new Error('Only GET requests are supported.');
  }

  const { code, entitlements } = await validateLicense();
  return res.status(200).json({ code, entitlements });
}

export default apiWrapper(handler);
