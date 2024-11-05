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

import { callEndpoint } from '@lowdefy/api';

import { serializer } from '@lowdefy/helpers';

import apiWrapper from '../../../lib/server/apiWrapper.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const { pageId, endpointId } = req.query;
  const { blockId, payload } = req.body;
  context.logger.info({ event: 'call_api_endpoint', blockId, endpointId, pageId });
  const response = await callEndpoint(context, { blockId, endpointId, pageId, payload });
  res.status(200).json(response);
  // res.status(200).json({
  //   response: serializer.serialize('Your Quote has been generated successfully.'),
  //   success: true,
  //   status: 'success',
  //   error: serializer.serialize(undefined),
  // });
}

export default apiWrapper(handler);