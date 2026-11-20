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

import validateJourney from './validateJourney.js';

// The validation of a discovered item's journey, a run under the name its journey was written
// with: a run of an expanded journey (expandJourney) is named `<name> [<user or row>]`, and the
// name limit applies to the name as written, never to the run name.
function validateJourneyItem({ item }) {
  if (type.isUndefined(item.expandedFrom)) {
    return validateJourney({ journey: item.journey });
  }
  return validateJourney({ journey: { ...item.journey, name: item.expandedFrom.name } });
}

export default validateJourneyItem;
