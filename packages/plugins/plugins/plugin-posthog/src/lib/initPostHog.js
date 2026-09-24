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

import loadPostHog from './loadPostHog.js';
import postHogState from './postHogState.js';

// PostHogInit runs from every page's onInit, so a repeat call with the same
// params must be a no-op. A disabled PostHog was never loaded, so a later call
// with enabled: true may still load it.
async function initPostHog({ apiKey, config, enabled, superProperties }) {
  const { status } = postHogState;

  if (enabled === false) {
    if (status === 'uninitialized' || status === 'disabled') {
      postHogState.status = 'disabled';
      return;
    }
    throw new Error(
      'PostHogInit was called with "enabled: false" after PostHog was already initialised. Use the same PostHogInit params on every page, and PostHogOptOut to stop capturing for a person.'
    );
  }

  if (status === 'uninitialized' || status === 'disabled') {
    postHogState.apiKey = apiKey;
    postHogState.status = 'loading';
    postHogState.loading = loadPostHog({ apiKey, config, superProperties });
    await postHogState.loading;
    return;
  }

  if (postHogState.apiKey !== apiKey) {
    throw new Error(
      `PostHogInit was already called with a different "apiKey". PostHog can only be initialised once per browser session. Received ${JSON.stringify(
        apiKey
      )}.`
    );
  }
  await postHogState.loading;
}

export default initPostHog;
