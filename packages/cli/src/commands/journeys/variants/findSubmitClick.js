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

import { isMountEventName, type } from '@lowdefy/helpers';
import { getStepKey, normaliseBlockId } from '@lowdefy/node-utils';

import findBlockConfig from './findBlockConfig.js';
import { targetBlockId } from './stepTarget.js';
import targetName from './targetName.js';

const INTERACTION_STEPS = ['click', 'open', 'press', 'back', 'goto', 'fill', 'select'];
const NO_SUBMIT = 'no submit click: no click followed by a wait for a write request';

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

// The page the click at `index` is on, and the event it ran: the run's last
// interaction event on the click's block names both; without one, the page
// is followed through the journey's goto steps.
function clickContext({ journey, exercised, index, blockId }) {
  if (!type.isNull(blockId)) {
    const configId = normaliseBlockId(blockId);
    const event = exercised.events
      .filter(
        (candidate) =>
          candidate.blockId === configId &&
          candidate.scope === 'page' &&
          !isMountEventName({ eventName: candidate.eventName })
      )
      .at(-1);
    if (!type.isUndefined(event)) {
      return { pageId: event.pageId, eventName: event.eventName };
    }
  }
  let pageId = journey.pageId;
  journey.steps.slice(0, index).forEach((step) => {
    if (getStepKey(step) === 'goto') {
      pageId = type.isString(step.goto) ? step.goto : step.goto.pageId;
    }
  });
  return { pageId, eventName: 'onClick' };
}

// The write endpoint a CallAPI action of the click's event names, when the
// run called it directly; null when that cannot be told.
function findEventEndpoint({ exercised, pageConfigs, pageId, blockId, eventName }) {
  if (type.isNull(blockId)) return null;
  const pages = pageConfigs.filter((pageConfig) => pageConfig.blockId === pageId);
  const block = findBlockConfig({ pageConfigs: pages, blockId });
  const actions = block?.events?.[eventName]?.try ?? [];
  const endpointIds = actions
    .filter((action) => action.type === 'CallAPI' && type.isString(action.params?.endpointId))
    .map((action) => action.params.endpointId);
  const endpoint = exercised.endpoints.find(
    (candidate) =>
      candidate.write && !type.isNull(candidate.calls) && endpointIds.includes(candidate.endpointId)
  );
  return type.isUndefined(endpoint) ? null : endpoint.endpointId;
}

// The submit click: the last click followed, before the next interaction, by
// a wait for a request the journey's measured run marks as a write on the
// page the click is on. Request ids are scoped to a page, so the write is
// that page's request. When the waited request does not write, the write is
// an endpoint a CallAPI action of the click's event names, if the run called
// it. Returns { index, pageId, write }, pageId being the page the click is
// on, or { skipped } with why.
function findSubmitClick({ journey, exercised, pageConfigs = [] }) {
  let skipped = NO_SUBMIT;
  for (let index = journey.steps.length - 1; index >= 0; index -= 1) {
    if (getStepKey(journey.steps[index]) !== 'click') {
      continue;
    }
    const requestId = waitedRequest({ steps: journey.steps, index });
    if (requestId === null) {
      continue;
    }
    const click = journey.steps[index].click;
    const blockId = targetBlockId(click);
    const { pageId, eventName } = clickContext({ journey, exercised, index, blockId });
    const request = exercised.requests.find(
      (candidate) =>
        candidate.requestId === requestId && candidate.pageId === pageId && candidate.write
    );
    if (!type.isUndefined(request)) {
      return { index, pageId, write: { request: requestId, pageId } };
    }
    const endpointId = findEventEndpoint({ exercised, pageConfigs, pageId, blockId, eventName });
    if (!type.isNull(endpointId)) {
      return { index, pageId, write: { endpoint: endpointId } };
    }
    if (exercised.endpoints.some((candidate) => candidate.write)) {
      skipped = `the click on "${targetName(
        click
      )}" waits for "${requestId}", which does not write on page "${pageId}", and which endpoint it wrote through cannot be told`;
    }
  }
  return { skipped };
}

export default findSubmitClick;
