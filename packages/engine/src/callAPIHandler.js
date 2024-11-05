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

import { serializer } from '@lowdefy/helpers';

async function callAPIHandler(context, { blockId, params }) {
  if (!context._internal.lowdefy.apiResponses[params.endpointId]) {
    context._internal.lowdefy.apiResponses[params.endpointId] = [];
  }

  const api = {
    ...params,
    blockId,
  };

  context._internal.lowdefy.apiResponses[api.endpointId].unshift(api);

  api.loading = true;
  api.success = null;
  api.pageId = context.pageId;
  const startTime = Date.now();

  try {
    const { error, response, status, success } = await context._internal.lowdefy._internal.callAPI({
      blockId: api.blockId,
      pageId: context.pageId,
      payload: serializer.serialize(api.payload),
      endpointId: api.endpointId,
    });

    api.error = serializer.deserialize(error);
    api.loading = false;
    api.response = serializer.deserialize(response);
    api.status = status;
    api.success = success;
    const endTime = Date.now();
    api.responseTime = endTime - startTime;
    context._internal.update();
  } catch (error) {
    api.error = error;
    api.loading = false;
    api.response = null;
    api.status = 'error';
    api.success = false;
    const endTime = Date.now();
    api.responseTime = endTime - startTime;
    context._internal.update();
    throw error;
  }

  return api;
}

export default callAPIHandler;
