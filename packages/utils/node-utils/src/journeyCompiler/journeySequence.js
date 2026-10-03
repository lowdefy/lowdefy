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

import { parsePageId, type } from '@lowdefy/helpers';

import { getStepKey } from '../journeyGrammar/validateJourneySteps.js';
import stepIdentity from './stepIdentity.js';

const INTERACTION_VERBS = ['click', 'select', 'fill', 'press', 'back'];

function nextPage({ step, page }) {
  const verb = getStepKey(step);
  const params = step[verb];
  if (verb === 'goto') {
    if (type.isString(params)) return params;
    return type.isString(params?.pageId) ? params.pageId : page;
  }
  // Only a contains that starts with a slash is an app path; anything else is a
  // fragment of a URL (a query, part of a path) and names no page.
  if (
    verb === 'expect' &&
    type.isString(params?.url?.contains) &&
    params.url.contains.startsWith('/')
  ) {
    return parsePageId(params.url.contains) ?? page;
  }
  return page;
}

// What a journey does, step by step: one { page, identity } per interaction,
// read statically from any journey (a compiled segment, a candidate, a
// committed journey). The page starts at pageId and moves on at a goto and at
// an expect.url whose path names a page. Expectations and waits add nothing,
// so a production segment (no expectations) and a dev segment of the same flow
// read the same sequence. Clustering hashes it, and coverage matches journeys
// to recorded segments with it.
function journeySequence({ pageId, steps }) {
  const sequence = [];
  let page = pageId;
  steps.forEach((step) => {
    const verb = getStepKey(step);
    if (INTERACTION_VERBS.includes(verb)) {
      sequence.push({ page, identity: stepIdentity({ step }) });
      return;
    }
    page = nextPage({ step, page });
  });
  return sequence;
}

export default journeySequence;
