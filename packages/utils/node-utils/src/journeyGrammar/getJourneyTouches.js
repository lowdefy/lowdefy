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

import getStepKey from './getStepKey.js';

// The block event each verb fires in the browser. This is the mapping that
// turns a journey back into the config it exercises, so it belongs beside the
// grammar the verbs come from.
const STEP_EVENTS = {
  click: ['onClick'],
  fill: ['onChange'],
  set: ['onChange'],
  select: ['onChange'],
};

// A bare `press` targets the page, not a block, and touches nothing this can
// name. `Enter` on a focused input reaches onEnter and onKeyDown; any other key
// reaches onKeyDown only.
function pressEvents({ key }) {
  return key === 'Enter' ? ['onEnter', 'onKeyDown'] : ['onKeyDown'];
}

function addTouch({ touches, pageId, blockId, events }) {
  events.forEach((event) => touches.push({ pageId, blockId, event }));
}

// Enumerates the (pageId, blockId, event) triples and request ids one journey
// exercises. Every triple is attributed to the journey's own pageId: a click
// that navigates is only knowable by running the journey, so a static reading
// under-counts cross-page touches rather than guessing at them.
function getJourneyTouches({ journey }) {
  const touches = [];
  const requestIds = [];
  const pageId = journey?.pageId;
  if (!type.isString(pageId) || !type.isArray(journey.steps)) {
    return { pageId, requestIds, touches };
  }

  journey.steps.forEach((step) => {
    const verb = getStepKey(step);
    if (type.isUndefined(verb)) return;
    const params = step[verb];

    if (verb === 'click' && type.isString(params)) {
      addTouch({ touches, pageId, blockId: params, events: STEP_EVENTS.click });
      return;
    }
    if (!type.isUndefined(STEP_EVENTS[verb]) && type.isObject(params)) {
      if (!type.isString(params.blockId)) return;
      addTouch({ touches, pageId, blockId: params.blockId, events: STEP_EVENTS[verb] });
      return;
    }
    if (verb === 'press' && type.isObject(params) && type.isString(params.blockId)) {
      addTouch({ touches, pageId, blockId: params.blockId, events: pressEvents(params) });
      return;
    }
    if (verb === 'wait' && type.isObject(params) && type.isString(params.request)) {
      requestIds.push(params.request);
    }
  });

  return { pageId, requestIds, touches };
}

export { STEP_EVENTS };

export default getJourneyTouches;
