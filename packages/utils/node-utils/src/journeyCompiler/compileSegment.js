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

import compileRecord from './compileRecord.js';
import compileUrlQuery from './compileUrlQuery.js';

const PRODUCTION_QUERY_COMMENT =
  'urlQuery values are not recorded in production: fill them in before running this journey';

function readRoles({ records }) {
  const withRoles = records.find((record) => type.isArray(record.roles));
  return withRoles?.roles;
}

// One segment of folded records compiled to one journey. The steps are the
// interactions in the order the user made them; what produced no step becomes
// a comment above the step that follows it, or the file's footer when nothing
// follows. A failing interaction ends the journey at its own step: what a
// failed chain left behind is not worth asserting, and the candidate is a
// failing test until the bug is fixed.
function compileSegment({ records, blockMetas = {}, source, name }) {
  const [first] = records;
  const production = first.source === 'production';
  const journey = { name, pageId: first.page_id };
  const steps = [];
  const comments = new Map();
  const pending = [];
  const flags = new Set();
  let failure;

  const addComment = (comment) => {
    if (pending[pending.length - 1] !== comment) pending.push(comment);
  };

  const entry = first.kind === 'pageview' && first.caused !== true;
  if (entry) {
    const urlQuery = compileUrlQuery({ url: first.url, production });
    if (!type.isUndefined(urlQuery)) {
      journey.urlQuery = urlQuery;
      if (production) addComment(PRODUCTION_QUERY_COMMENT);
    }
  }
  const roles = readRoles({ records });
  if (['dev', 'explorer'].includes(source) && type.isArray(roles) && roles.length > 0) {
    journey.user = { roles };
  }

  let lastInteraction;
  for (const record of entry ? records.slice(1) : records) {
    // Going back is the step; the page view it brought back is not a second one.
    const absorbed = record.kind === 'pageview' && lastInteraction === 'back';
    if (record.kind !== 'engine') lastInteraction = record.kind;
    if (absorbed) continue;
    const result = compileRecord({ record, blockMetas });
    result.comments.forEach(addComment);
    result.flags.forEach((flag) => flags.add(flag));
    if (type.isUndefined(failure)) failure = result.failure;
    if (result.steps.length > 0) {
      if (pending.length > 0) {
        comments.set(steps.length, pending.join('\n'));
        pending.length = 0;
      }
      steps.push(...result.steps);
    }
    if (result.ends) break;
  }

  journey.steps = steps;
  return {
    journey,
    comments,
    footer: pending.length === 0 ? undefined : pending.join('\n'),
    failure,
    flags: [...flags].sort(),
  };
}

export default compileSegment;
