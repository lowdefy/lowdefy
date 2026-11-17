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

import isExpandedJourney from './isExpandedJourney.js';
import journeyRuns from './journeyRuns.js';
import validateJourney from './validateJourney.js';

// A journey that runs more than once (a `cases` table, or a `user` list) is one item per run
// (journeyRuns), its journey the run and `expandedFrom` the journey as written. Any other item
// is returned as it is, an invalid journey included, so the runner refuses it once as an
// invalid file. validateJourney fills in each row and validates the run.
function expandJourney({ item }) {
  if (!type.isNone(item.error) || !isExpandedJourney({ journey: item.journey })) {
    return [item];
  }
  if (!validateJourney({ journey: item.journey }).valid) {
    return [item];
  }
  const { runs } = journeyRuns({ journey: item.journey });
  return runs.map((run) => ({
    filePath: item.filePath,
    journeyIndex: item.journeyIndex,
    journey: run,
    expandedFrom: item.journey,
  }));
}

export default expandJourney;
