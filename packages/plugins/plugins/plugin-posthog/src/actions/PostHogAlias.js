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

// Point a second id at the person PostHog already knows, for example when an
// app has its own identifier alongside the one used by PostHogIdentify.
function PostHogAlias({ params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { alias } = params ?? {};
  if (!type.isString(alias) || alias.trim() === '') {
    throw new Error(
      `PostHogAlias "alias" must be a non-empty string. Received ${JSON.stringify(alias)}.`
    );
  }

  posthog.alias(alias);
  return null;
}

export default PostHogAlias;
