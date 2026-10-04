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

import validateJourneyTags, { JOURNEY_TAG_PATTERN } from './validateJourneyTags.js';

test('validateJourneyTags accepts an empty list and well-formed tags', () => {
  expect(validateJourneyTags({ tags: [] })).toEqual({});
  expect(validateJourneyTags({ tags: ['smoke', 'review-flow', 'v2_beta', '9lives'] })).toEqual({});
});

test('validateJourneyTags names the first tag that breaks the pattern', () => {
  expect(validateJourneyTags({ tags: ['smoke', 'Smoke', 'a b'] })).toEqual({
    error:
      'Tag "Smoke" should be lowercase letters, digits, "-" and "_", start with a letter or digit, and be at most 64 characters.',
  });
  expect(validateJourneyTags({ tags: ['-smoke'] }).error).toContain('Tag "-smoke"');
  expect(validateJourneyTags({ tags: ['a'.repeat(65)] }).error).toContain('at most 64');
  expect(validateJourneyTags({ tags: ['../journeys'] }).error).toContain('Tag "../journeys"');
});

test('validateJourneyTags refuses a tag that is not a string and tags that are not a list', () => {
  expect(validateJourneyTags({ tags: [3] }).error).toContain('Tag 3 should be');
  expect(validateJourneyTags({ tags: 'smoke' })).toEqual({
    error: 'Tags should be a list of strings. Received "smoke".',
  });
});

test('JOURNEY_TAG_PATTERN is the data set name pattern', () => {
  expect(JOURNEY_TAG_PATTERN.source).toEqual('^[a-z0-9][a-z0-9_-]{0,63}$');
});
