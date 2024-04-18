/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import { callRequest } from '@lowdefy/api';

import apiWrapper from '../../../../lib/server/apiWrapper.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const { pageId, requestId } = req.query;
  const { blockId, payload } = req.body;
  context.logger.info({ event: 'call_request', pageId, requestId, blockId });
  const response = await callRequest(context, { blockId, pageId, payload, requestId });
  res.status(200).json(response);
}

export default apiWrapper(handler);
