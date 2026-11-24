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
import runsOnlyInProcess from './runsOnlyInProcess.js';

// Whether a run may take a journey to the browser, read before its server starts, when the dev
// server's build hash is not known yet: a browser run, a thorough mixed run (any journey may be
// found to need a browser partway through), or a mixed run with a journey routeJourney may send
// there (a classifier browser-only journey, or one remembered as browser-only, whatever config it
// was found on). Such a run takes the journey run slots before it starts the server, as a browser
// run does.
function mayRunInBrowser({ entries, runner, thorough, records, configDirectory }) {
  if (runner !== 'mixed') {
    return runner === 'browser';
  }
  if (thorough) {
    return true;
  }
  return entries.some(({ item }) => {
    if (!type.isUndefined(checkJourneyItem({ item })) || runsOnlyInProcess({ item })) {
      return false;
    }
    if (!classifyJourney({ journey: item.journey }).headless) {
      return true;
    }
    return !type.isUndefined(findBrowserOnlyRecord({ records, configDirectory, item }));
  });
}

export default mayRunInBrowser;
