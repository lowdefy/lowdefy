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
import { validateJourneyTags } from '@lowdefy/node-utils';

import asList from './asList.js';

// The filters and tags a `lowdefy test` or lowdefy_run_tests run selects
// journeys by, as lists. An empty filter selects nothing out, as before, and a
// tag outside the journey tag grammar is refused: no journey could carry it.
function parseTestSelection({ filter, tags }) {
  const filters = asList(filter);
  if (!filters.every((value) => type.isString(value))) {
    return {
      error: `Filter should be a string or a list of strings. Received ${JSON.stringify(filter)}.`,
    };
  }
  const tagList = asList(tags);
  const { error } = validateJourneyTags({ tags: tagList });
  if (!type.isUndefined(error)) {
    return { error };
  }
  return { filters: filters.filter((value) => value !== ''), tags: tagList };
}

export default parseTestSelection;
