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

import normalizeErrorSources from './normalizeErrorSources.js';
import omitErrorProps from './omitErrorProps.js';
import redactErrorResponse from './redactErrorResponse.js';

// The wire object every endpoint route returns after running its routine. One
// function rather than a copy of the same return statement per route, so the
// `response` field cannot end up policed differently from the `error` field beside
// it.
//
// The response takes the same policy, because it reaches the same audience:
// makeReplacer wraps any Error it meets anywhere in a value, so an error riding
// inside a routine's response value is redacted and its source normalised by
// construction rather than left out as a non-goal.
function buildEndpointResult(context, { error, response, status }) {
  const success = !['error', 'reject'].includes(status);
  return {
    error: redactErrorResponse(context, error),
    response: normalizeErrorSources(context, serializer.serialize(response, { omitErrorProps })),
    status: success ? 'success' : status,
    success,
  };
}

export default buildEndpointResult;
