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

// Capture a named product event. Autocapture already records clicks and
// pageviews, so this is for the moments that deserve a funnel step of their
// own and that no DOM event names well. Keep the set small: every event is
// billable, and a funnel of thirty near identical events tells you less than
// one of five.
//
// Never pass personally identifiable information as a property.
async function PostHogCapture({ params }) {
  const { event, groups, properties } = params ?? {};
  if (!type.isString(event) || event.trim() === '') {
    throw new Error(
      `PostHogCapture "event" must be a non-empty string. Received ${JSON.stringify(event)}.`
    );
  }
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogCapture "properties" must be an object. Received ${JSON.stringify(properties)}.`
    );
  }
  if (!type.isNone(groups) && !type.isObject(groups)) {
    throw new Error(
      `PostHogCapture "groups" must be an object. Received ${JSON.stringify(groups)}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogCapture' });
  if (type.isNone(posthog)) return null;

  const eventProperties = { ...(properties ?? {}) };
  if (type.isObject(groups)) {
    eventProperties.$groups = groups;
  }

  posthog.capture(event, eventProperties);
  return null;
}

export default PostHogCapture;
