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

import findOnPathCopy from './findOnPathCopy.js';

function anchorPageId(anchor) {
  return anchor.type === 'endpoint' ? null : anchor.pageId;
}

function keptByPages({ mutant, pages, baselines }) {
  if (type.isNone(pages) || pages.length === 0) {
    return true;
  }
  if (mutant.anchor.type === 'endpoint') {
    return baselines.some(
      ({ exercised }) =>
        exercised.pages.some((pageId) => pages.includes(pageId)) &&
        exercised.endpoints.some(({ endpointId }) => endpointId === mutant.anchor.endpointId)
    );
  }
  // App-event mutants run on every journey, so a page-scoped run leaves them out.
  // A `_ref`'d node is kept when any page it is copied onto is named.
  return [mutant.anchor, ...mutant.copyTargets.map(({ anchor }) => anchor)].some((anchor) =>
    pages.includes(anchorPageId(anchor))
  );
}

// Pairs each listed mutant with the journeys whose baseline exercised it, on
// any page it is copied onto. Mutants on no journey's path are only counted:
// no assertion in these journeys could kill them. --page keeps mutants
// anchored or copied on those pages and the endpoint mutants a journey
// touching them called; --operators keeps the operators named.
function scopeMutants({ mutants, baselines, pages, operators }) {
  const onPath = [];
  let notExercised = 0;
  mutants.forEach((mutant) => {
    if (!type.isNone(operators) && !operators.includes(mutant.operator)) {
      return;
    }
    if (!keptByPages({ mutant, pages, baselines })) {
      return;
    }
    const journeys = baselines
      .filter(({ exercised }) => !type.isUndefined(findOnPathCopy({ mutant, exercised })))
      .map(({ key }) => key);
    if (journeys.length === 0) {
      notExercised += 1;
      return;
    }
    onPath.push({ ...mutant, journeys });
  });
  return { onPath, notExercised };
}

export default scopeMutants;
