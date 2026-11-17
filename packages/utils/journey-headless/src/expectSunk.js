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
import { assertMatches } from '@lowdefy/test-utils/assert';

import HeadlessStepError from './HeadlessStepError.js';
import pollUntil from './pollUntil.js';

const KEYS = ['connectionType', 'requestType', 'requestId'];

function describeRequests(params) {
  const keys = Object.fromEntries(
    KEYS.filter((key) => !type.isUndefined(params[key])).map((key) => [key, params[key]])
  );
  return Object.keys(keys).length === 0
    ? 'requests to outside services'
    : `requests to outside services matching ${JSON.stringify(keys)}`;
}

function findRequests({ params, session }) {
  return session.sunk.filter((record) =>
    KEYS.every((key) => type.isUndefined(params[key]) || record[key] === params[key])
  );
}

// What the requests found fail to show, or undefined when they hold what the step expects: their
// count, the last one's request properties holding `match`, or, with neither, that there is one.
function findSunkMismatch({ params, records }) {
  const description = describeRequests(params);
  if (!type.isUndefined(params.count) && records.length !== params.count) {
    return {
      message: `Expected ${params.count} ${description} but found ${records.length}.`,
      expected: params.count,
      actual: records.length,
    };
  }
  if (type.isUndefined(params.match)) {
    if (!type.isUndefined(params.count) || records.length > 0) {
      return undefined;
    }
    return {
      message: `Expected ${description} but the journey made none.`,
      expected: `at least one of the ${description}`,
      actual: 0,
    };
  }
  const last = records.at(-1);
  if (type.isUndefined(last)) {
    return {
      message: `Expected the last of the ${description} to hold ${JSON.stringify(
        params.match
      )} but the journey made none.`,
      expected: params.match,
      actual: null,
    };
  }
  try {
    assertMatches(last.request, params.match);
    return undefined;
  } catch (error) {
    return {
      message: `Expected the last of the ${description} to hold ${JSON.stringify(
        params.match
      )}: ${error.message}`,
      expected: params.match,
      actual: last.request,
    };
  }
}

// expect.sunk reads the requests the journey's data session recorded instead of sending them to an
// outside service, stubbed ones included (`sunk`), narrowed by connectionType, requestType and
// requestId, and waits up to `timeout` ms for them to hold what the step expects, since a request
// the app sends in the background (context.waitUntil) may land after the step that caused it.
// `session` is the data session (@lowdefy/test-utils/dataSets), on every host.
async function expectSunk({ params, session, timeout }) {
  if (type.isNone(session)) {
    throw new HeadlessStepError(
      'expect.sunk reads the requests the journey\'s data session recorded, and this journey declares no "data".',
      { actual: 'no data set', expected: 'a journey with a data set' }
    );
  }
  const { held, value } = await pollUntil({
    check: (mismatch) => type.isUndefined(mismatch),
    read: () => findSunkMismatch({ params, records: findRequests({ params, session }) }),
    timeout,
  });
  if (!held) {
    throw new HeadlessStepError(value.message, { actual: value.actual, expected: value.expected });
  }
}

export default expectSunk;
