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

// posthog-js is imported here, and only here, so an app that runs with
// enabled: false never downloads or runs the SDK.
async function loadPostHog({ apiKey, config, superProperties = {} }) {
  let posthog;
  try {
    ({ default: posthog } = await import('posthog-js'));
  } catch (error) {
    // The SDK chunk failed to download, for example on a flaky network.
    // Analytics must never break an app, so the other actions become no-ops.
    postHogState.status = 'failed';
    // eslint-disable-next-line no-console
    console.warn('PostHogInit could not load posthog-js. PostHog actions will do nothing.', error);
    return;
  }
  posthog.init(apiKey, config);
  if (Object.keys(superProperties).length > 0) {
    posthog.register(superProperties);
  }
  postHogState.client = posthog;
  postHogState.status = 'enabled';
}

export default loadPostHog;
