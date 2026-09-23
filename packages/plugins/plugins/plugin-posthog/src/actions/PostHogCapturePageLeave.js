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

// Capture a pageleave by hand, the counterpart to PostHogPageview. posthog-js
// captures pageleaves itself when the tab closes, as long as automatic
// pageviews are on (capture_pageleave defaults to 'if_capture_pageview'). This
// action is for apps that turned those off and capture pageviews by hand.
async function PostHogCapturePageLeave({ params }) {
  const { properties } = params ?? {};
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogCapturePageLeave "properties" must be an object. Received ${JSON.stringify(
        properties
      )}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogCapturePageLeave' });
  if (type.isNone(posthog)) return null;

  posthog.capture('$pageleave', properties ?? undefined);
  return null;
}

export default PostHogCapturePageLeave;
