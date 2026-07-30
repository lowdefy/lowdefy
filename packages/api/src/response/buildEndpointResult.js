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

import redactErrorResponse from './redactErrorResponse.js';
import redactResponse from './redactResponse.js';

// The wire object every endpoint route returns after running its routine. One
// function rather than a copy of the same return statement per route, so the
// `response` field cannot end up policed differently from the `error` field beside
// it - see redactResponse for why the response needs the policy at all.
function buildEndpointResult(context, { error, response, status }) {
  const success = !['error', 'reject'].includes(status);
  return {
    error: redactErrorResponse(context, error),
    response: redactResponse(context, response),
    status: success ? 'success' : status,
    success,
  };
}

export default buildEndpointResult;
