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

import { type } from '@lowdefy/helpers';

import isEventCall from './isEventCall.js';

// The API endpoints this event's CallAPI actions called, as trace record
// entries. `apiResponses[endpointId]` is a newest-first call history whose
// entries carry the block and the id of the action that made the call, read
// as collectEventRequests reads request calls.
function collectEventEndpoints({ blockId, context, responses }) {
  const apiResponses = context?._internal?.lowdefy?.apiResponses ?? {};
  const endpoints = [];
  Object.keys(apiResponses).forEach((endpointId) => {
    const call = (apiResponses[endpointId] ?? [])[0];
    if (!isEventCall({ blockId, call, responses })) return;
    endpoints.push({
      id: endpointId,
      ok: call.success === true,
      ms: type.isNumber(call.responseTime) ? call.responseTime : null,
    });
  });
  return endpoints;
}

export default collectEventEndpoints;
