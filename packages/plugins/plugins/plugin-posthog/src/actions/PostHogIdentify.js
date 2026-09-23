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

import cleanProperties from '../lib/cleanProperties.js';
import getPostHog from '../lib/getPostHog.js';

// Tie the current browser session to a person. Run it once the user is known,
// usually from the page onInit event after PostHogInit, or after a successful
// login. It is safe to run on every page.
//
// Never pass personally identifiable information as a property.
async function PostHogIdentify({ params }) {
  const { id, properties, propertiesOnce } = params ?? {};
  if (!type.isNone(id) && !type.isString(id)) {
    throw new Error(`PostHogIdentify "id" must be a string. Received ${JSON.stringify(id)}.`);
  }
  if (!type.isNone(properties) && !type.isObject(properties)) {
    throw new Error(
      `PostHogIdentify "properties" must be an object. Received ${JSON.stringify(properties)}.`
    );
  }
  if (!type.isNone(propertiesOnce) && !type.isObject(propertiesOnce)) {
    throw new Error(
      `PostHogIdentify "propertiesOnce" must be an object. Received ${JSON.stringify(
        propertiesOnce
      )}.`
    );
  }

  const posthog = await getPostHog({ action: 'PostHogIdentify' });
  if (type.isNone(posthog)) return null;

  // Anonymous visitor on a public page. Leave the anonymous session alone:
  // it is what a later identify() merges into the person.
  if (type.isNone(id) || id.trim() === '') return null;

  const set = cleanProperties(properties);
  const setOnce = cleanProperties(propertiesOnce);

  if (posthog.get_distinct_id() === id) {
    // posthog-js skips a setPersonProperties call identical to the last one,
    // so running this on every page load does not resend unchanged properties.
    if (Object.keys(set).length > 0 || Object.keys(setOnce).length > 0) {
      posthog.setPersonProperties(set, setOnce);
    }
    return null;
  }

  // PostHog refuses to move an identified distinct_id onto a different person,
  // so a person swap on a shared browser needs a fresh session first. An
  // anonymous session is not reset: identify() merges it into the person,
  // which is what makes signup funnels work.
  if (posthog.get_property('$user_state') === 'identified') {
    posthog.reset();
  }

  posthog.identify(id, set, setOnce);
  return null;
}

export default PostHogIdentify;
