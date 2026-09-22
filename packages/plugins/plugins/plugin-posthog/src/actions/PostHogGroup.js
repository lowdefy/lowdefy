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

// Associate the current person with a group, so events can be analysed per
// organisation, team or account. The association sticks until reset() is
// called, so run it after PostHogIdentify.
function PostHogGroup({ params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { type: groupType, key, properties } = params ?? {};
  if (!type.isString(groupType) || groupType.trim() === '') {
    throw new Error(
      `PostHogGroup "type" must be a non-empty string. Received ${JSON.stringify(groupType)}.`
    );
  }
  if (!type.isString(key) || key.trim() === '') {
    throw new Error(
      `PostHogGroup "key" must be a non-empty string. Received ${JSON.stringify(key)}.`
    );
  }
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogGroup "properties" must be an object. Received ${JSON.stringify(properties)}.`
    );
  }

  posthog.group(groupType, key, type.isObject(properties) ? properties : undefined);
  return null;
}

export default PostHogGroup;
