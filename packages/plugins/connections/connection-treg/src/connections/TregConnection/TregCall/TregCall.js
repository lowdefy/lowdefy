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

import mapTregError from '../mapTregError.js';
import microUsd from '../microUsd.js';
import tregFetch from '../tregFetch.js';
import awaitAsyncTask from './awaitAsyncTask.js';
import buildCallHeaders from './buildCallHeaders.js';
import mapCallResponse from './mapCallResponse.js';
import readAsyncTask from './readAsyncTask.js';
import resolveCallPath from './resolveCallPath.js';
import schema from './schema.js';

async function TregCall({ request, connection, signal }) {
  const { path, target } = resolveCallPath({ request, connection });
  const hasBody = !type.isNone(request.body);
  const response = await tregFetch({
    connection,
    method: request.method ?? (hasBody ? 'POST' : 'GET'),
    path,
    query: request.query,
    headers: buildCallHeaders({ request, connection }),
    body: hasBody ? request.body : undefined,
    signal,
  });
  if (response.status < 200 || response.status >= 300) {
    throw mapTregError({ response, target, connection });
  }

  // Routed endpoints are treg's own treg.<capability> rows, which say so in
  // X-Treg-Route-Outcome.
  const routed =
    type.isString(request.endpoint) &&
    (request.endpoint.startsWith('treg.') || response.headers.has('x-treg-route-outcome'));
  const result = mapCallResponse({ response, routed });

  const task = readAsyncTask({ response, target });
  if (type.isNone(task)) return result;
  if (type.isNone(request.await)) {
    return {
      ...result,
      // Nothing is charged until the task succeeds; task.reserved is what it holds.
      cost: microUsd(0),
      pending: true,
      task: { id: task.id, status: null, pollEndpoint: task.pollEndpoint, reserved: task.reserved },
    };
  }
  return awaitAsyncTask({ connection, request, target, result, task, signal });
}

TregCall.schema = schema;
// Like AxiosHttp and the other API-calling requests, TregCall does not use the connection
// read/write flags. It can cost money and have side effects, so bound it with maxCost
// and idempotencyKey, and keep it in server-side routines.
TregCall.meta = {
  checkRead: false,
  checkWrite: false,
};

export default TregCall;
