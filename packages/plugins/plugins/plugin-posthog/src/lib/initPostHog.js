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

import posthog from 'posthog-js';

import postHogState from './postHogState.js';

// Called once per browser session by the PostHogInit action. A repeat call
// with the same apiKey is a no-op, so PostHogInit can safely sit on an event
// that runs more than once.
function initPostHog({ apiKey, config, enabled }) {
  if (postHogState.initialized) {
    if (postHogState.apiKey === apiKey) return;
    throw new Error(
      `PostHogInit was already called with a different "apiKey". Received ${JSON.stringify(
        apiKey
      )}.`
    );
  }

  postHogState.apiKey = apiKey;
  postHogState.initialized = true;

  if (enabled === false) {
    postHogState.enabled = false;
    return;
  }

  postHogState.enabled = true;
  posthog.init(apiKey, config);
  postHogState.client = posthog;
}

export default initPostHog;
