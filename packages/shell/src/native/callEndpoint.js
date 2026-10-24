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

import { getAuthorizationHeaders } from '@lowdefy/client-core';
import { serializer, type } from '@lowdefy/helpers';

/**
 * Calls one of the app's API endpoints from the shell itself, with the session token: push token
 * registration, notification buttons, uploads, widget sources, background fetch and background
 * location. No page is involved, so no build id is sent (endpoints are the stable contract across
 * builds). Returns the endpoint's response; throws when the server refuses the call (the error
 * carries the HTTP `status`) or the endpoint rejects or errors.
 *
 * @param {Object} params
 * @param {Object} params.app The open app ({ apiBase, fetch, tokenStore }, currentApp.js).
 * @param {string} params.endpointId
 * @param {Object} [params.payload]
 */
async function callEndpoint({ app, endpointId, payload = {} }) {
  const res = await app.fetch(`${app.apiBase}/api/endpoints/${endpointId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeaders({ host: { authTransport: 'bearer', tokenStore: app.tokenStore } }),
    },
    body: JSON.stringify({ payload: serializer.serialize(payload) }),
  });
  const body = await res.json();
  if (!res.ok) {
    const error = new Error(body?.message ?? `Endpoint "${endpointId}" answered ${res.status}.`);
    // The HTTP status, so background posts can tell a refusal that will not change from an outage.
    error.status = res.status;
    throw error;
  }
  if (body.success === false) {
    throw new Error(
      type.isString(body.error?.message)
        ? body.error.message
        : `Endpoint "${endpointId}" answered ${body.status}.`
    );
  }
  return serializer.deserialize(body.response);
}

export default callEndpoint;
