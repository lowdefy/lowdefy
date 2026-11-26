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
import { getStepKey } from '@lowdefy/node-utils';

function checksPayload(step) {
  if (getStepKey(step) !== 'expect' || getStepKey(step.expect) !== 'calls') {
    return false;
  }
  const { payload, response } = step.expect.calls;
  return !type.isUndefined(payload) || !type.isUndefined(response);
}

// The browser runner counts a journey's calls but does not record what they sent or got, so an
// expect.calls on a payload or response is refused before any browser opens, rather than passed
// unchecked. Returns the error, or undefined.
function validateBrowserCallChecks({ steps }) {
  const index = steps.findIndex(checksPayload);
  if (index === -1) {
    return undefined;
  }
  return `Step ${index}: expect.calls with "payload" or "response" needs a headless run (the browser runner does not record payloads yet).`;
}

export default validateBrowserCallChecks;
