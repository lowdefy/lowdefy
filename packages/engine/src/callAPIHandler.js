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

import { serializer } from '@lowdefy/helpers';

import decodeServerError from './decodeServerError.js';
import reportAppChange from './tracking/reportAppChange.js';

async function callAPIHandler(context, { blockId, params }) {
  if (!context._internal.lowdefy.apiResponses[params.endpointId]) {
    context._internal.lowdefy.apiResponses[params.endpointId] = [];
  }

  const holdValue = params.holdValue === true;
  const previousResponse =
    context._internal.lowdefy.apiResponses[params.endpointId][0]?.response ?? null;

  const api = {
    ...params,
    blockId,
    loading: true,
    success: null,
    pageId: context.pageId,
    startTimestamp: new Date(),
    endTimestamp: null,
  };
  if (holdValue) {
    api.holdValue = true;
    api.response = previousResponse;
  }
  context._internal.lowdefy.apiResponses[api.endpointId].unshift(api);
  reportAppChange({ context, key: `api:${api.endpointId}` });

  let apiResponse;

  try {
    apiResponse = await context._internal.lowdefy._internal.callAPI({
      blockId: api.blockId,
      pageId: context.pageId,
      payload: serializer.serialize(api.payload),
      endpointId: api.endpointId,
    });
  } catch (error) {
    api.error = error;
    api.loading = false;
    if (!holdValue) {
      api.response = null;
    }
    api.status = 'error';
    api.success = false;
    api.endTimestamp = new Date();
    api.responseTime = api.endTimestamp - api.startTimestamp;
    reportAppChange({ context, key: `api:${api.endpointId}` });
    context._internal.update();
    throw error;
  }

  const { error, response, status, success } = apiResponse;
  // Decoded once so the stored and the thrown error are the same object: the
  // dev error is keyed by that object.
  const decodedError = decodeServerError(error);

  api.error = decodedError;
  api.loading = false;
  api.response = serializer.deserialize(response);
  api.status = status;
  api.success = success;
  api.endTimestamp = new Date();
  api.responseTime = api.endTimestamp - api.startTimestamp;

  reportAppChange({ context, key: `api:${api.endpointId}` });
  context._internal.update();

  if (!success) {
    throw decodedError;
  }

  return api;
}

export default callAPIHandler;
