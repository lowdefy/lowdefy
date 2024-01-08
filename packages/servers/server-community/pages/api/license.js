/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/
import apiWrapper from '../../lib/server/apiWrapper.js';

async function handler({ req, res }) {
  if (req.method !== 'GET') {
    throw new Error('Only GET requests are supported.');
  }

  return res
    .status(200)
    .json({ code: 'Apache-2.0', entitlements: [], metadata: {}, timestamp: new Date() });
}

export default apiWrapper(handler);
