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

// Read a feature flag and return its value, so it can be used further down the
// action chain with the _actions operator.
//
// The flag value is whatever PostHog resolved for this person when flags were
// last loaded; it does not wait for a network call. Use
// PostHogReloadFeatureFlags first when the person or their groups just changed.
function PostHogFeatureFlag({ params }) {
  const { key, default: defaultValue, enabled, payload } = params ?? {};
  if (!type.isString(key) || key.trim() === '') {
    throw new Error(
      `PostHogFeatureFlag "key" must be a non-empty string. Received ${JSON.stringify(key)}.`
    );
  }
  if (!type.isNone(enabled) && !type.isBoolean(enabled)) {
    throw new Error(
      `PostHogFeatureFlag "enabled" must be a boolean. Received ${JSON.stringify(enabled)}.`
    );
  }
  if (!type.isNone(payload) && !type.isBoolean(payload)) {
    throw new Error(
      `PostHogFeatureFlag "payload" must be a boolean. Received ${JSON.stringify(payload)}.`
    );
  }

  const fallback = type.isNone(defaultValue) ? null : defaultValue;

  // Not initialised or disabled - the app still needs an answer, and the
  // configured default is a better one than null.
  const posthog = getPostHog();
  if (type.isNone(posthog)) return fallback;

  let value;
  if (payload === true) {
    value = posthog.getFeatureFlagPayload(key);
  } else if (enabled === true) {
    value = posthog.isFeatureEnabled(key);
  } else {
    value = posthog.getFeatureFlag(key);
  }

  if (type.isNone(value)) return fallback;
  return value;
}

export default PostHogFeatureFlag;
