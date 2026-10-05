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
import matchPagePath from '../matchPagePath.js';
import stepIdentity from './stepIdentity.js';
import urlPath from './urlPath.js';

const INTERACTION_VERBS = ['click', 'select', 'fill', 'press', 'back', 'open'];

const EMPTY_ROUTE_TABLE = { routes: [], basePath: '' };

// The page a goto names; null for a goto without one.
function pageOfGoto({ step }) {
  const params = step.goto;
  if (type.isString(params)) return params;
  return type.isString(params?.pageId) ? params.pageId : null;
}

// The page whose route matches the path an expect.url asserts, or null. Only a
// `contains` that starts with "/" is a path: the compiler writes the whole
// path (and query) a navigation landed on, and a fragment or a query alone
// names no page. The app's basePath is removed when the path carries it.
function pageOfExpectUrl({ step, routeTable }) {
  const { contains } = step.expect?.url ?? {};
  if (!type.isString(contains) || !contains.startsWith('/')) return null;
  let path = urlPath({ url: contains });
  if (type.isUndefined(path)) return null;
  const { basePath } = routeTable;
  if (basePath !== '' && (path === basePath || path.startsWith(`${basePath}/`))) {
    path = path.slice(basePath.length);
  }
  const match = matchPagePath({ routes: routeTable.routes, path: path.slice(1) });
  return match?.pageId ?? null;
}

// The page a step moves the journey to; null for a step that moves none.
function pageMovedTo({ step, routeTable }) {
  const verb = getStepKey(step);
  if (verb === 'goto') return pageOfGoto({ step });
  if (verb === 'expect') return pageOfExpectUrl({ step, routeTable });
  return null;
}

// What a journey does, step by step: one { page, identity } per interaction,
// read statically from any journey (a compiled segment, a candidate, a
// committed journey). The page starts at pageId and moves on at a goto, and at
// an expect.url whose path matches a page in `routeTable` ({ routes, basePath
// }, the build's routes.json and config basePath), which is how a recorded
// navigation by click says where it landed. Without a route table the page
// moves only at a goto. Other expectations and waits add nothing, so a
// production segment (no state expectations) and a dev segment of the same
// flow read the same sequence. Clustering hashes it, and coverage matches
// journeys to recorded segments with it.
//
// Two hand-written verbs the compiler never emits: an `open` reads as a click
// on its target (stepIdentity), and is not folded into a select with the
// option click after it. An `email` leaves the app for the message, so the
// steps after it act on the email, which no recording sees: they add nothing
// until a step moves the journey to a page again, and with no such step the
// journey is read no further. A fill with fromEmail types into the app, so it
// reads as any fill.
function journeySequence({ pageId, steps, routeTable = EMPTY_ROUTE_TABLE }) {
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
    const movedTo = pageMovedTo({ step, routeTable });
    if (!type.isNull(movedTo)) {
      page = movedTo;
      inEmail = false;
    }
  });
  return sequence;
}

export default journeySequence;
