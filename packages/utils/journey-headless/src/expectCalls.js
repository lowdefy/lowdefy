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
import toJsonValue from './toJsonValue.js';

function plural(count) {
  return `${count} time${count === 1 ? '' : 's'}`;
}

// The first difference between the last call's payload or response and what the check names, or
// undefined when the call holds everything it names (a partial match: the call may carry more).
function findCallMismatch({ call, params }) {
  for (const part of ['payload', 'response']) {
    if (type.isUndefined(params[part])) continue;
    try {
      assertMatches(toJsonValue(call[part]), params[part]);
    } catch (error) {
      return { part, message: error.message.split('\n').filter(Boolean)[0] };
    }
  }
  return undefined;
}

// expect.calls: the calls the actor made to a request (on pageId, the current page by default) or
// an endpoint since the journey started, the page's own and its call and request steps. Counted
// once the page has settled, without polling, as the browser runner counts. With count, the
// number must match; with payload or response, the last of the calls must hold them, and a
// mismatch names that call and the first path that differs.
async function expectCalls({ actor, params }) {
  await actor.settle();
  let description;
  let calls;
  if (type.isUndefined(params.endpoint)) {
    const pageId = params.pageId ?? actor.page?.pageId;
    if (type.isNone(pageId)) {
      throw new HeadlessStepError(
        `Expected request "${params.request}" to be counted on the current page, but no page is open.`,
        { actual: null, expected: `a page to count request "${params.request}" on` }
      );
    }
    description = `request "${params.request}" on page "${pageId}"`;
    calls = actor.calls.filter(
      (call) =>
        call.kind === 'request' && call.requestId === params.request && call.pageId === pageId
    );
  } else {
    description = `endpoint "${params.endpoint}"`;
    calls = actor.calls.filter(
      (call) => call.kind === 'endpoint' && call.endpointId === params.endpoint
    );
  }
  if (!type.isUndefined(params.count) && calls.length !== params.count) {
    throw new HeadlessStepError(
      `Expected ${description} to have been called ${plural(
        params.count
      )} but it was called ${plural(calls.length)}.`,
      { actual: calls.length, expected: params.count }
    );
  }
  if (type.isUndefined(params.payload) && type.isUndefined(params.response)) {
    return;
  }
  if (calls.length === 0) {
    throw new HeadlessStepError(`Expected ${description} to have been called, but it was not.`, {
      actual: 0,
      expected: `a call to ${description}`,
    });
  }
  const last = calls[calls.length - 1];
  const mismatch = findCallMismatch({ call: last, params });
  if (!type.isUndefined(mismatch)) {
    throw new HeadlessStepError(
      `Expected the last call to ${description} (call ${calls.length} of ${calls.length}) to hold the ${mismatch.part} given: ${mismatch.message}`,
      {
        actual: toJsonValue(last[mismatch.part]),
        expected: params[mismatch.part],
      }
    );
  }
}

export default expectCalls;
