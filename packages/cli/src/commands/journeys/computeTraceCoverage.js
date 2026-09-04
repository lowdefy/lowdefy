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

import { getJourneyTouches } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

function tripleKey({ blockId, event, pageId }) {
  return `${pageId} ${blockId} ${event}`;
}

// Journey coverage against a production trace: the share of the (page, block,
// event) triples users actually drove that a committed journey exercises. The
// static denominator `lowdefy test --coverage` uses counts what the app can do;
// this one counts what its users do, which is the list worth working down.
//
// Two things to know when reading the number: the recorder only sees events the
// config declares a handler for, and a sample rate below 1 makes the
// denominator itself a sample. It is a trend, not a threshold to gate on.
function computeTraceCoverage({ journeys, triples }) {
  const covered = new Set();
  journeys.forEach(({ journey }) => {
    if (type.isNone(journey)) return;
    getJourneyTouches({ journey }).touches.forEach((touch) => covered.add(tripleKey(touch)));
  });

  const uncovered = triples.filter(
    (triple) =>
      !covered.has(
        tripleKey({
          blockId: triple.block_id,
          event: triple.event_name,
          pageId: triple.page_id,
        })
      )
  );
  const total = triples.length;
  return {
    covered: total - uncovered.length,
    share: total === 0 ? 1 : (total - uncovered.length) / total,
    total,
    uncovered,
  };
}

export default computeTraceCoverage;
