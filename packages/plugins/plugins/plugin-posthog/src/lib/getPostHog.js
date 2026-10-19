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

import postHogState from './postHogState.js';
import warnUninitialized from './warnUninitialized.js';

// Returns the posthog-js instance, or null when the calling action should do
// nothing. Analytics must never break an app, so a disabled, failed or missing
// PostHog is never an error here. Callers validate their params first, so
// invalid config is still caught in environments where PostHog is off.
async function getPostHog({ action }) {
  if (postHogState.status === 'loading') {
    await postHogState.loading;
  }
  if (postHogState.status === 'enabled') {
    return postHogState.client;
  }
  if (postHogState.status === 'uninitialized') {
    warnUninitialized({ action });
  }
  return null;
}

export default getPostHog;
