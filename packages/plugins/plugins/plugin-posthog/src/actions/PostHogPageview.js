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

// Capture a pageview by hand. Lowdefy routes on the client without a page
// load, so the posthog-js default (capture_pageview: true) only records the
// first page. Prefer PostHogInit options.capture_pageview: 'history_change',
// which records every client side navigation. Use this action instead when
// pageviews need extra properties or tighter control: set capture_pageview to
// false and run it from each page's onMount event.
async function PostHogPageview({ params }) {
  const { properties } = params ?? {};
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogPageview "properties" must be an object. Received ${JSON.stringify(properties)}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogPageview' });
  if (type.isNone(posthog)) return null;

  posthog.capture('$pageview', properties ?? undefined);
  return null;
}

export default PostHogPageview;
