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

// Update the properties of the person PostHogIdentify identified. Each call is
// a billable event, so send properties only when they change.
//
// Never send personally identifiable information.
function PostHogSetPersonProperties({ params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { set, setOnce } = params ?? {};
  if (!type.isNone(set) && !type.isObject(set)) {
    throw new Error(
      `PostHogSetPersonProperties "set" must be an object. Received ${JSON.stringify(set)}.`
    );
  }
  if (!type.isNone(setOnce) && !type.isObject(setOnce)) {
    throw new Error(
      `PostHogSetPersonProperties "setOnce" must be an object. Received ${JSON.stringify(setOnce)}.`
    );
  }
  if (type.isNone(set) && type.isNone(setOnce)) {
    throw new Error('PostHogSetPersonProperties requires a "set" or "setOnce" object.');
  }

  posthog.setPersonProperties(
    type.isObject(set) ? set : undefined,
    type.isObject(setOnce) ? setOnce : undefined
  );
  return null;
}

export default PostHogSetPersonProperties;
