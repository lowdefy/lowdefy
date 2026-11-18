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

import checkSessionOpen from './checkSessionOpen.js';
import { addFailGate } from './dataSets/index.js';

const KEYS = new Set(['requestId', 'endpoint', 'pageId', 'message', 'times']);

function isText(value) {
  return type.isString(value) && value !== '';
}

function isTimes(value) {
  return value === 'all' || (type.isInt(value) && value > 0);
}

// Makes a request fail, for a test of a routine's error handling. The next request with this id
// (a request step in an endpoint routine, or a page request's id), on any connection, throws a
// ServiceError with `message` before it runs, as a real outage would; every other request runs
// for real. `endpoint` and `pageId` narrow it when two routines share a request id. `times` fails
// the next n matching requests, or 'all' of them; once by default. The gate is kept on the data
// session until reset().
function failRequest({ gate, testSession }) {
  checkSessionOpen({ testSession });
  if (!type.isObject(gate)) {
    throw new Error(
      `fail takes { requestId, endpoint?, pageId?, message, times? }. Received ${JSON.stringify(
        gate
      )}.`
    );
  }
  const unknown = Object.keys(gate).find((key) => !KEYS.has(key));
  if (!type.isUndefined(unknown)) {
    throw new Error(
      `fail does not take "${unknown}". It takes requestId, endpoint, pageId, message and times.`
    );
  }
  const { endpoint, message, pageId, requestId, times } = gate;
  if (!isText(requestId)) {
    throw new Error(`fail takes a requestId. Received ${JSON.stringify(requestId)}.`);
  }
  if (!type.isUndefined(endpoint) && !isText(endpoint)) {
    throw new Error(
      `fail "endpoint" should be an endpoint id. Received ${JSON.stringify(endpoint)}.`
    );
  }
  if (!type.isUndefined(pageId) && !isText(pageId)) {
    throw new Error(`fail "pageId" should be a page id. Received ${JSON.stringify(pageId)}.`);
  }
  if (!isText(message)) {
    throw new Error(
      `fail takes the message the request fails with. Received ${JSON.stringify(message)}.`
    );
  }
  if (!type.isUndefined(times) && !isTimes(times)) {
    throw new Error(
      `fail "times" should be a whole number above 0 or "all". Received ${JSON.stringify(times)}.`
    );
  }
  addFailGate({
    endpoint,
    message,
    pageId,
    requestId,
    session: testSession.dataSession.session,
    times,
  });
}

export default failRequest;
