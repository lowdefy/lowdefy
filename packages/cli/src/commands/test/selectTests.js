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

import discoverJourneys from './discoverJourneys.js';
import formatJourneyResult from './formatJourneyResult.js';
import runJourney from './runJourney.js';

// Each suite discovers its own test items and runs one item against the dev server.
// Request tests (tests/requests/*.test.yaml) are added here as a second entry.
const suites = [
  {
    name: 'journeys',
    discover: discoverJourneys,
    run: runJourney,
    format: formatJourneyResult,
  },
];

function getItemName(item) {
  return item.journey?.name ?? item.filePath;
}

function matchesFilter({ item, filter }) {
  if (type.isNone(filter)) {
    return true;
  }
  return getItemName(item).toLowerCase().includes(filter.toLowerCase());
}

// The tests `lowdefy test` and the lowdefy_run_tests MCP tool run: every
// suite's items whose name contains filter (case-insensitive).
function selectTests({ context, filter }) {
  return suites
    .flatMap((suite) => suite.discover({ context }).map((item) => ({ suite, item })))
    .filter(({ item }) => matchesFilter({ item, filter }));
}

export default selectTests;
