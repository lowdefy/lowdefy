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

const INTERACTION_STEPS = ['click', 'open', 'press', 'back', 'goto', 'fill', 'select'];

function waitedRequest({ steps, index }) {
  for (let next = index + 1; next < steps.length; next += 1) {
    const step = steps[next];
    const key = getStepKey(step);
    if (key === 'wait' && getStepKey(step.wait) === 'request') {
      return step.wait.request;
    }
    if (INTERACTION_STEPS.includes(key)) {
      return null;
    }
  }
  return null;
}

// The submit click: the last click followed, before the next interaction, by
// a wait for a request the journey's measured run marks as a write. Its write
// is that request, on the page the run called it on. When the waited request
// does not write but the run called an endpoint that does, the write is that
// endpoint. Null when the journey has no submit click.
function findSubmitClick({ journey, exercised }) {
  for (let index = journey.steps.length - 1; index >= 0; index -= 1) {
    if (getStepKey(journey.steps[index]) !== 'click') {
      continue;
    }
    const requestId = waitedRequest({ steps: journey.steps, index });
    if (requestId === null) {
      continue;
    }
    const request = exercised.requests.find(
      (candidate) => candidate.requestId === requestId && candidate.write
    );
    if (!type.isUndefined(request)) {
      return { index, write: { request: requestId, pageId: request.pageId } };
    }
    const endpoint = exercised.endpoints.find(
      (candidate) => candidate.write && !type.isNull(candidate.calls)
    );
    if (!type.isUndefined(endpoint)) {
      return { index, write: { endpoint: endpoint.endpointId } };
    }
  }
  return null;
}

export default findSubmitClick;
