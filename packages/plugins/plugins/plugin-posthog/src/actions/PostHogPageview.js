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

// Capture a pageview by hand. Only needed when PostHogInit sets
// options.capture_pageview to false, which is the usual choice for a Lowdefy
// app: the client routes without a page load, so the automatic pageview fires
// once and never again. Run this from each page's events.onEnter.
function PostHogPageview({ params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { properties } = params ?? {};
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogPageview "properties" must be an object. Received ${JSON.stringify(properties)}.`
    );
  }

  posthog.capture('$pageview', type.isObject(properties) ? properties : undefined);
  return null;
}

export default PostHogPageview;
