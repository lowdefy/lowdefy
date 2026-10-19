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

import crypto from 'crypto';
import { stableStringify } from '@lowdefy/helpers';

// The fields that decide what a journey run does. The name keys the
// exercised.json entry; evidence, tags and the rest describe the journey
// without changing its run, so `journeys evidence --refresh` keeps every
// measured path current.
const runFields = ['pageId', 'steps', 'user', 'data', 'pathParams', 'urlQuery'];

// Identifies one version of a journey's run: an exercised.json entry whose
// hash no longer matches describes a journey whose run has since changed.
function hashJourney(journey) {
  const run = {};
  runFields.forEach((field) => {
    run[field] = journey[field] ?? null;
  });
  return crypto.createHash('sha1').update(stableStringify(run)).digest('hex');
}

export default hashJourney;
