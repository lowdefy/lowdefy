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

import { getStepKey } from '../journeyGrammar/validateJourneySteps.js';
import stepIdentity from './stepIdentity.js';

const INTERACTION_VERBS = ['click', 'select', 'fill', 'press', 'back', 'open'];

// The page a goto moves the journey to; null for every other step.
function pageNamedBy({ step }) {
  if (getStepKey(step) !== 'goto') return null;
  const params = step.goto;
  if (type.isString(params)) return params;
  return type.isString(params?.pageId) ? params.pageId : null;
}

// What a journey does, step by step: one { page, identity } per interaction,
// read statically from any journey (a compiled segment, a candidate, a
// committed journey). The page starts at pageId and moves on at a goto. An
// expect.url names no page: its path may hold path values, and only the route
// table could say which page it is. Expectations and waits add nothing,
// so a production segment (no expectations) and a dev segment of the same flow
// read the same sequence. Clustering hashes it, and coverage matches journeys
// to recorded segments with it.
//
// Two hand-written verbs the compiler never emits: an `open` reads as a click
// on its target (stepIdentity), and is not folded into a select with the
// option click after it. An `email` leaves the app for the message, so the
// steps after it act on the email, which no recording sees: they add nothing
// until a goto names a page again, and with no such step the journey is read
// no further. A fill with fromEmail types into the app, so it
// reads as any fill.
function journeySequence({ pageId, steps }) {
  const sequence = [];
  let page = pageId;
  let inEmail = false;
  steps.forEach((step) => {
    const verb = getStepKey(step);
    if (verb === 'email') {
      inEmail = true;
      return;
    }
    if (INTERACTION_VERBS.includes(verb)) {
      if (!inEmail) {
        sequence.push({ page, identity: stepIdentity({ step }) });
      }
      return;
    }
    const namedPage = pageNamedBy({ step });
    if (!type.isNull(namedPage)) {
      page = namedPage;
      inEmail = false;
    }
  });
  return sequence;
}

export default journeySequence;
