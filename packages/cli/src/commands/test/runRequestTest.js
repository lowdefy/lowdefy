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
import axios from 'axios';
import { serializer, type } from '@lowdefy/helpers';
import { getRejectExpectation, validateRequestTest } from '@lowdefy/node-utils';

import getTestServerDirectory from './getTestServerDirectory.js';
import matchExpectation from './matchExpectation.js';
import resolveFixtures from './resolveFixtures.js';
import seedFixtures from './seedFixtures.js';

function describeHttpError({ route, error }) {
  if (type.isNone(error.response)) {
    return `Could not reach the dev server: ${error.message}`;
  }
  const body = type.isString(error.response.data)
    ? error.response.data
    : JSON.stringify(error.response.data);
  return `POST ${route} responded ${error.response.status}: ${body}`;
}

function getTarget({ test }) {
  if (type.isString(test.endpointId)) {
    return {
      route: '/lowdefy-docs/run-endpoint',
      body: { endpointId: test.endpointId, payload: test.payload ?? {}, user: test.user },
      label: `endpoint ${test.endpointId}`,
    };
  }
  return {
    route: '/lowdefy-docs/run-request',
    body: {
      pageId: test.pageId,
      requestId: test.requestId,
      payload: test.payload ?? {},
      user: test.user,
    },
    label: `request ${test.pageId}.${test.requestId}`,
  };
}

// The two shapes a refusal reaches the runner in: the write gate and the tenant
// wall refuse before the request runs, a :reject or a connection failure comes
// back as an error. Both are rejections a test can assert on.
function readRejection({ result }) {
  if (result.refused === true) {
    const lines = [result.reason];
    if (type.isString(result.howToEnable)) {
      lines.push(result.howToEnable);
    }
    return { name: 'Refused', message: lines.join(' ') };
  }
  if (type.isNone(result.error)) {
    return undefined;
  }
  if (type.isObject(result.error)) {
    return { name: result.error.name ?? 'Error', message: String(result.error.message) };
  }
  return { name: 'Error', message: String(result.error) };
}

function describeRejection({ label, rejection }) {
  if (rejection.name === 'Refused') {
    return `Refused: ${rejection.message}`;
  }
  return `${label} failed. ${rejection.name}: ${rejection.message}`;
}

// expect: { reject: { messageContains?, name? } } inverts the outcome - the
// rejection is the assertion, and a successful response is the failure.
function matchRejection({ name, filePath, durationMs, fail, label, reject, rejection, result }) {
  if (type.isNone(rejection)) {
    return fail({
      durationMs,
      message: `Expected ${label} to reject, it returned ${JSON.stringify(result.response)}.`,
    });
  }
  if (!type.isNone(reject.name) && rejection.name !== reject.name) {
    return fail({
      durationMs,
      mismatch: { path: 'reject.name', expected: reject.name, actual: rejection.name },
    });
  }
  if (!type.isNone(reject.messageContains) && !rejection.message.includes(reject.messageContains)) {
    return fail({
      durationMs,
      mismatch: {
        path: 'reject.messageContains',
        expected: reject.messageContains,
        actual: rejection.message,
      },
    });
  }
  return { name, filePath, passed: true, durationMs };
}

// Runs one discovered request test: validate, seed, call the dev server's
// run-request or run-endpoint route, compare. Every outcome - invalid file, seed
// failure, transport failure, refusal, request error, mismatch - is returned in
// one result shape for the reporter.
async function runRequestTest({ context, item, url, session }) {
  const { filePath, test } = item;
  const name = test?.name ?? filePath;
  const fail = (fields) => ({ name, filePath, passed: false, durationMs: 0, ...fields });
  if (!type.isNone(item.error)) {
    return fail({ message: item.error });
  }
  const validation = validateRequestTest({ test });
  if (!validation.valid) {
    return fail({ message: `Invalid request test: ${validation.message}` });
  }
  const start = Date.now();
  const { fixtures, error: fixtureError } = resolveFixtures({ names: test.fixtures, session });
  if (!type.isNone(fixtureError)) {
    return fail({ message: fixtureError });
  }
  // Seeding runs for every test of a seeded run, not only for tests that declare
  // their own data: a test without `seed` must still start from a database
  // cleared of what the previous test wrote.
  if (!type.isNone(session.client)) {
    try {
      await seedFixtures({
        client: session.client,
        devDirectory: getTestServerDirectory({ context }),
        seed: test.seed,
        fixtures,
        seeded: session.seeded,
        ObjectId: session.ObjectId,
      });
    } catch (error) {
      return fail({ message: error.message, durationMs: Date.now() - start });
    }
  }
  const { route, body, label } = getTarget({ test });
  let response;
  try {
    response = await axios.post(`${url}${route}`, body);
  } catch (error) {
    return fail({
      message: describeHttpError({ route, error }),
      durationMs: Date.now() - start,
    });
  }
  const durationMs = Date.now() - start;
  const result = response.data ?? {};
  // The route returns the response serialized (~d dates), and a test can write
  // the same markers in expect - deserialize both so dates compare as dates.
  const expected = serializer.deserialize(test.expect);
  const reject = getRejectExpectation(expected);
  const rejection = readRejection({ result });
  if (!type.isNone(reject)) {
    return matchRejection({ name, filePath, durationMs, fail, label, reject, rejection, result });
  }
  if (!type.isNone(rejection)) {
    return fail({ message: describeRejection({ label, rejection }), durationMs });
  }
  if (result.success === false) {
    return fail({
      message: `${label} did not succeed. ${JSON.stringify(result.response)}`,
      durationMs,
    });
  }
  const match = matchExpectation({
    expected,
    actual: serializer.deserialize(result.response),
  });
  if (match.matched) {
    return { name, filePath, passed: true, durationMs };
  }
  return fail({ durationMs, mismatch: match });
}

export default runRequestTest;
