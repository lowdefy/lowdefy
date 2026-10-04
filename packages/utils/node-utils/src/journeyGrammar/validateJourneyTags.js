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

import dataSetNamePattern from '../dataSetNamePattern.js';

// A tag names a section of a suite (`lowdefy test --tag smoke`). It is the
// data set name pattern, so a tag reads the same in a journey file, on the
// command line and in an MCP call.
const JOURNEY_TAG_PATTERN = dataSetNamePattern;

// Validates a list of journey tags, from a journey's `tags` key or from the
// tags a run selects. Returns { error } naming the first bad tag, or {}.
function validateJourneyTags({ tags }) {
  if (!type.isArray(tags)) {
    return { error: `Tags should be a list of strings. Received ${JSON.stringify(tags)}.` };
  }
  const invalid = tags.find((tag) => !type.isString(tag) || !JOURNEY_TAG_PATTERN.test(tag));
  if (!type.isUndefined(invalid)) {
    return {
      error: `Tag ${JSON.stringify(
        invalid
      )} should be lowercase letters, digits, "-" and "_", start with a letter or digit, and be at most 64 characters.`,
    };
  }
  return {};
}

export { JOURNEY_TAG_PATTERN };
export default validateJourneyTags;
