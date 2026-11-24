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
import { classifyJourney } from '@lowdefy/node-utils';

import checkJourneyItem from './checkJourneyItem.js';
import findBrowserOnlyRecord from './findBrowserOnlyRecord.js';

// Where a journey of the run goes before any journey runs: "headless" or "browser". A browser or
// headless run sends every journey there. A mixed run sends a journey the classifier marks
// browser-only (classifyJourney) to the browser, and so one an earlier headless run found needs a
// browser partway through (findBrowserOnlyRecord), while the dev server's build hash as this run
// starts, `configHash` (hashBuild), is one that run recorded, so it doesn't repeat headless steps;
// the rest go headless. A dev server builds each page as it is first opened, so its build hash
// moves as journeys open pages: a run records the hash as it started and as it ended, which match
// the next run's start on a fresh server and on one kept running, while nothing changed between
// them. A journey no runner can take (checkJourneyItem) is refused the same either way, and
// goes headless, which needs no browser slot.
function routeJourney({ item, runner, records, configDirectory, configHash }) {
  if (runner !== 'mixed') {
    return runner;
  }
  if (!type.isUndefined(checkJourneyItem({ item }))) {
    return 'headless';
  }
  if (!classifyJourney({ journey: item.journey }).headless) {
    return 'browser';
  }
  const record = findBrowserOnlyRecord({ records, configDirectory, item });
  if (
    !type.isUndefined(record) &&
    !type.isNone(configHash) &&
    (record.configHashes ?? []).includes(configHash)
  ) {
    return 'browser';
  }
  return 'headless';
}

export default routeJourney;
