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

// Forget the current person and start a fresh anonymous session. Run it on
// sign out so the next person on a shared browser is not merged into this one.
async function PostHogReset({ params }) {
  const { resetDeviceId } = params ?? {};
  if (!type.isNone(resetDeviceId) && !type.isBoolean(resetDeviceId)) {
    throw new Error(
      `PostHogReset "resetDeviceId" must be a boolean. Received ${JSON.stringify(resetDeviceId)}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogReset' });
  if (type.isNone(posthog)) return null;

  posthog.reset(resetDeviceId === true);
  return null;
}

export default PostHogReset;
