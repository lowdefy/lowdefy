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

// Start capturing for this person. Pair it with PostHogOptOut and a PostHogInit
// that sets options.opt_out_capturing_by_default to true when consent is
// required before any data is sent.
function PostHogOptIn() {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  posthog.opt_in_capturing();
  return null;
}

export default PostHogOptIn;
