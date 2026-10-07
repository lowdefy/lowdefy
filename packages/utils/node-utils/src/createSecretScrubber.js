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

import collectStringLeaves from './collectStringLeaves.js';
import createValueScrubber from './createValueScrubber.js';
import scrubCredentials from './scrubCredentials.js';

// The scrub replaces the app's secrets, and the values the current request marked as
// credentials (markCredential), with [REDACTED].
function createSecretScrubber({ secrets, env = process.env }) {
  const values = collectStringLeaves(secrets);
  if (!type.isNone(env.CRON_SECRET)) values.push(env.CRON_SECRET);
  if (!type.isNone(env.BETTER_AUTH_SECRET)) values.push(env.BETTER_AUTH_SECRET);
  const scrubValues = createValueScrubber(values);

  return function scrub(value) {
    return scrubCredentials(scrubValues(value));
  };
}

export default createSecretScrubber;
