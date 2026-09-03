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

// The same denominator `lowdefy test --coverage` reports against
// (packages/cli/src/commands/test/journeyCoverage/computeJourneyCoverage.js):
// every declared (blockId, event) triple, plus one triple per page request so a
// request no journey waits on reads as uncovered too.
function declaredTriples({ page }) {
  const triples = (page?.events ?? []).map(({ blockId, event }) => ({ blockId, event }));
  (page?.requestIds ?? []).forEach((requestId) =>
    triples.push({ blockId: requestId, event: 'request' })
  );
  return triples;
}

function tripleKey({ blockId, event }) {
  return `${blockId} ${event}`;
}

// journeyIndex.json is what a `--coverage` run recorded and is authoritative
// for the names; without it the same names are recomputed from the journey
// files, which are the source either way.
function journeyNames({ pageId, journeys, journeyIndex }) {
  const indexed = journeyIndex?.pages?.[pageId];
  if (type.isArray(indexed)) {
    return [...indexed];
  }
  const names = [];
  journeys.forEach((journey) => {
    if (journey.pageId !== pageId || names.includes(journey.name)) {
      return;
    }
    names.push(journey.name);
  });
  return names;
}

// A journey attributes every triple it exercises to its own pageId
// (getJourneyTouches), so covering journeys are the ones that start on the page.
function coveredKeys({ pageId, journeys }) {
  const covered = new Set();
  journeys
    .filter((journey) => journey.pageId === pageId)
    .forEach((journey) => {
      journey.touches.forEach((touch) => covered.add(tripleKey(touch)));
      journey.requestIds.forEach((requestId) =>
        covered.add(tripleKey({ blockId: requestId, event: 'request' }))
      );
    });
  return covered;
}

function summarizePageTests({
  pageId,
  coveragePage,
  journeys,
  requestTests,
  journeyIndex,
  endpointIds,
}) {
  const declared = declaredTriples({ page: coveragePage });
  const covered = coveredKeys({ pageId, journeys });
  const uncovered = declared.filter((triple) => !covered.has(tripleKey(triple)));
  return {
    journeys: journeyNames({ pageId, journeys, journeyIndex }),
    requestTests: requestTests
      .filter((test) => test.pageId === pageId || endpointIds.includes(test.endpointId))
      .map((test) => ({
        file: test.file,
        name: test.name,
        requestId: test.requestId,
        endpointId: test.endpointId,
      })),
    events: {
      declared: declared.length,
      covered: declared.length - uncovered.length,
      uncovered,
    },
  };
}

export default summarizePageTests;
