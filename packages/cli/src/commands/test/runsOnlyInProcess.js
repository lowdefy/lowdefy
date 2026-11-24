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

// Whether a journey has a step only the headless runner takes (hold, release, a call as system;
// classifyJourney's inProcess), which a browser run refuses. A mixed run never sends such a
// journey to the browser: one that needs a browser too stays browser-only.
function runsOnlyInProcess({ item }) {
  if (!type.isUndefined(checkJourneyItem({ item }))) {
    return false;
  }
  return !type.isUndefined(classifyJourney({ journey: item.journey }).inProcess);
}

export default runsOnlyInProcess;
