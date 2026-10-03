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

import operators from './operators/index.js';

function isStringArray(value) {
  return type.isArray(value) && value.every((item) => type.isString(item));
}

// The body of POST /lowdefy-docs/mutants: what a set of journey runs
// exercised. Returns { body } with defaults, or { error } naming the field.
function validateMutantsBody(body) {
  if (!type.isObject(body)) {
    return { error: `The body must be a JSON object. Received ${JSON.stringify(body)}.` };
  }
  const { pages = [], requests = [], endpoints = [], appEvents = false } = body;
  if (!isStringArray(pages)) {
    return { error: `"pages" must be an array of page ids. Received ${JSON.stringify(pages)}.` };
  }
  if (
    !type.isArray(requests) ||
    !requests.every(
      (request) =>
        type.isObject(request) && type.isString(request.pageId) && type.isString(request.requestId)
    )
  ) {
    return {
      error: `"requests" must be an array of { pageId, requestId }. Received ${JSON.stringify(
        requests
      )}.`,
    };
  }
  if (!isStringArray(endpoints)) {
    return {
      error: `"endpoints" must be an array of endpoint ids. Received ${JSON.stringify(endpoints)}.`,
    };
  }
  if (!type.isBoolean(appEvents)) {
    return { error: `"appEvents" must be a boolean. Received ${JSON.stringify(appEvents)}.` };
  }
  if (!type.isNone(body.operators)) {
    const unknown = isStringArray(body.operators)
      ? body.operators.filter((name) => type.isUndefined(operators[name]))
      : [body.operators];
    if (unknown.length > 0) {
      return {
        error: `"operators" must be an array of operator names (${Object.keys(operators).join(
          ', '
        )}). Received ${JSON.stringify(body.operators)}.`,
      };
    }
  }
  return {
    body: {
      pages,
      requests: requests.map(({ pageId, requestId }) => ({ pageId, requestId })),
      endpoints,
      appEvents,
      operators: body.operators ?? null,
    },
  };
}

export default validateMutantsBody;
