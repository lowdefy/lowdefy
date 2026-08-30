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

import matchExpectation from './matchExpectation.js';
import seedFixtures from './seedFixtures.js';
import validateRequestTest from './validateRequestTest.js';

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
  if (!type.isNone(test.seed)) {
    try {
      await seedFixtures({
        client: session.client,
        devDirectory: context.directories.dev,
        seed: test.seed,
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
  if (result.refused === true) {
    const lines = [`Refused: ${result.reason}`];
    if (type.isString(result.howToEnable)) {
      lines.push(result.howToEnable);
    }
    return fail({ message: lines.join(' '), durationMs });
  }
  if (!type.isNone(result.error)) {
    const message = type.isObject(result.error)
      ? `${result.error.name ?? 'Error'}: ${result.error.message}`
      : String(result.error);
    return fail({ message: `${label} failed. ${message}`, durationMs });
  }
  if (result.success === false) {
    return fail({
      message: `${label} did not succeed. ${JSON.stringify(result.response)}`,
      durationMs,
    });
  }
  // The route returns the response serialized (~d dates), and a test can write
  // the same markers in expect - deserialize both so dates compare as dates.
  const match = matchExpectation({
    expected: serializer.deserialize(test.expect),
    actual: serializer.deserialize(result.response),
  });
  if (match.matched) {
    return { name, filePath, passed: true, durationMs };
  }
  return fail({ durationMs, mismatch: match });
}

export default runRequestTest;
