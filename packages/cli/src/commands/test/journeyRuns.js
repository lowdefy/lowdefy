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

import expandCases from './expandCases.js';
import isExpandedJourney from './isExpandedJourney.js';
import personaJourney from './personaJourney.js';

// The runs a journey as written stands for: one per `cases` row (expandCases), one per user of a
// `user` list (personaJourney), or the journey itself. Returns { runs } or { error }.
function journeyRuns({ journey }) {
  if (!isExpandedJourney({ journey })) {
    return { runs: [journey] };
  }
  if (!type.isUndefined(journey.cases)) {
    return expandCases({ journey });
  }
  return { runs: journey.user.map((user) => personaJourney({ journey, user })) };
}

export default journeyRuns;
