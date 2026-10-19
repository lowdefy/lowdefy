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

import getPostHog from '../lib/getPostHog.js';

const defaultTimeout = 5000;

// Ask PostHog to evaluate this person's feature flags again, and resolve once
// the new flags have arrived. Run it after PostHogIdentify or PostHogGroup,
// then read the flags with PostHogFeatureFlag.
//
// Resolves with { flags, variants } - flags is the list of enabled flag keys,
// variants maps every flag key to its value. Resolves with empty results if
// PostHog does not answer within "timeout" milliseconds, so a flaky network
// can never stall the action chain.
async function PostHogReloadFeatureFlags({ params }) {
  const { timeout } = params ?? {};
  if (!type.isNone(timeout) && (!type.isInt(timeout) || timeout < 0)) {
    throw new Error(
      `PostHogReloadFeatureFlags "timeout" must be a non-negative integer. Received ${JSON.stringify(
        timeout
      )}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogReloadFeatureFlags' });
  if (type.isNone(posthog)) return { flags: [], variants: {} };

  return new Promise((resolve) => {
    let listening = false;
    let timer;
    let unsubscribe;

    function settle(flags, variants) {
      clearTimeout(timer);
      unsubscribe();
      resolve({ flags: flags ?? [], variants: variants ?? {} });
    }

    // onFeatureFlags calls back straight away with the flags that are already
    // loaded. Those are the stale flags this action exists to replace, so only
    // a call that arrives after it returns counts.
    unsubscribe = posthog.onFeatureFlags((flags, variants) => {
      if (listening) settle(flags, variants);
    });
    listening = true;
    timer = setTimeout(() => settle(), timeout ?? defaultTimeout);
    posthog.reloadFeatureFlags();
  });
}

export default PostHogReloadFeatureFlags;
