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
import postHogState from '../lib/postHogState.js';
import readIdentifiedId from '../lib/readIdentifiedId.js';
import writeIdentifiedId from '../lib/writeIdentifiedId.js';

// Tie the current browser session to a person. Run it once the user is known,
// usually from the app level events.onInit or after a successful login.
//
// Person properties are sent again only when they change, because each
// setPersonProperties call is a billable event and this action runs on every
// page load. Never pass personally identifiable information as a property.
function PostHogIdentify({ globals, params }) {
  const posthog = getPostHog();
  if (type.isNone(posthog)) return null;

  const { id, properties: personProperties, propertiesOnce: personPropertiesOnce } = params ?? {};
  // Anonymous visitor on a public page. Leave the anonymous session alone:
  // it is what a later identify() merges into the person.
  if (type.isNone(id)) return null;
  if (!type.isString(id)) {
    throw new Error(`PostHogIdentify "id" must be a string. Received ${JSON.stringify(id)}.`);
  }
  if (id.trim() === '') return null;

  const properties = cleanProperties(personProperties);
  const propertiesOnce = cleanProperties(personPropertiesOnce);
  const fingerprint = JSON.stringify([properties, propertiesOnce]);
  const identifiedId = readIdentifiedId({ window: globals.window });

  if (identifiedId === id) {
    const unchanged = fingerprint === postHogState.lastPersonProperties;
    const empty = Object.keys(properties).length === 0 && Object.keys(propertiesOnce).length === 0;
    if (unchanged || empty) return null;
    posthog.setPersonProperties(properties, propertiesOnce);
    postHogState.lastPersonProperties = fingerprint;
    return null;
  }

  // A different person on this browser - drop the previous identity and its
  // session before claiming the new one.
  if (type.isString(identifiedId) && identifiedId !== '') {
    posthog.reset();
  }

  posthog.identify(id, properties, propertiesOnce);
  writeIdentifiedId({ id, window: globals.window });
  postHogState.lastPersonProperties = fingerprint;
  return null;
}

export default PostHogIdentify;
