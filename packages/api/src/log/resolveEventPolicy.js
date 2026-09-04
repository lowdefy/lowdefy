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

// Normalizes the `logger.events` app config into the policy logEvent reads.
// The build writes the object form into build/logger.json, but the string
// form and an absent value are accepted here so a context built by a server
// that carries no logger config (the e2e server, a test) still emits the
// documented default: failures only.
function resolveEventPolicy(events) {
  if (type.isString(events)) {
    return { level: events, sampleRate: null, identity: false };
  }
  if (type.isObject(events)) {
    return {
      level: events.level ?? 'errors',
      sampleRate: type.isNumber(events.sample_rate) ? events.sample_rate : null,
      identity: events.identity === true,
    };
  }
  return { level: 'errors', sampleRate: null, identity: false };
}

export default resolveEventPolicy;
