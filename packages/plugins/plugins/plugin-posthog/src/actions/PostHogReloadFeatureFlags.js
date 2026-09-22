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
// the flags are available. Run it after PostHogIdentify or PostHogGroup, then
// read the flags with PostHogFeatureFlag.
//
// Resolves with { flags, variants } - flags is the list of enabled flag keys,
// variants maps every flag key to its value. Resolves with empty results if
// PostHog does not answer within "timeout" milliseconds, so a flaky network
// can never stall the action chain.
function PostHogReloadFeatureFlags({ params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { timeout } = params ?? {};
  if (!type.isNone(timeout) && !type.isInt(timeout)) {
    throw new Error(
      `PostHogReloadFeatureFlags "timeout" must be an integer. Received ${JSON.stringify(timeout)}.`
    );
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe;

    function settle(flags, variants) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (type.isFunction(unsubscribe)) unsubscribe();
      resolve({ flags: flags ?? [], variants: variants ?? {} });
    }

    const timer = setTimeout(settle, timeout ?? defaultTimeout);

    posthog.reloadFeatureFlags();
    unsubscribe = posthog.onFeatureFlags((flags, variants) => settle(flags, variants));
    // onFeatureFlags fires immediately when flags are already loaded, before
    // unsubscribe was assigned, so drop the listener here instead.
    if (settled && type.isFunction(unsubscribe)) unsubscribe();
  });
}

export default PostHogReloadFeatureFlags;
