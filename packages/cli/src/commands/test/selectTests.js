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

import asList from './asList.js';
import discoverJourneys from './discoverJourneys.js';
import expandPersonas from './expandPersonas.js';
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

function matchesFilters({ item, filters }) {
  if (filters.length === 0) {
    return true;
  }
  const name = getItemName(item).toLowerCase();
  return filters.some((filter) => name.includes(filter.toLowerCase()));
}

function matchesTags({ item, tags }) {
  if (tags.length === 0) {
    return true;
  }
  const itemTags = asList(item.journey?.tags);
  return tags.some((tag) => itemTags.includes(tag));
}

// The tests `lowdefy test` and the lowdefy_run_tests MCP tool run: every
// suite's items (from `paths` when given) whose name contains any of the
// filters (case-insensitive) and that carry any of the tags. `filter` is one
// string or a list; paths, filters and tags combine with AND. A journey with a
// list of users is one item per user, named `<name> [<user>]`, so a filter can
// pick one persona run.
function selectTests({ context, filter, tags, paths }) {
  const filters = asList(filter);
  const tagList = asList(tags);
  return suites
    .flatMap((suite) =>
      suite
        .discover({ context, paths })
        .flatMap((item) => expandPersonas({ item }))
        .map((item) => ({ suite, item }))
    )
    .filter(({ item }) => matchesFilters({ item, filters }))
    .filter(({ item }) => matchesTags({ item, tags: tagList }));
}

export default selectTests;
