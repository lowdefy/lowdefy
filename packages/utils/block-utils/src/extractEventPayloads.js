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

// Reduces a block meta's events to the name -> { payload } map the build reads.
// Descriptions never ship: the result is bundled into every app's types.js.
// A payload is a JSON Schema for the object the block passes as
// methods.triggerEvent({ name, event }). The legacy { description, event: { key: desc } }
// form is normalised to a payload with description-only properties (no type,
// since prose carries none). The string form declares no payload.
function extractEventPayloads(events) {
  const payloads = {};
  Object.entries(events).forEach(([name, def]) => {
    if (!type.isObject(def)) {
      payloads[name] = {};
      return;
    }
    if (type.isObject(def.payload)) {
      payloads[name] = { payload: def.payload };
      return;
    }
    if (type.isObject(def.event)) {
      const properties = {};
      Object.entries(def.event).forEach(([key, description]) => {
        properties[key] = { description };
      });
      payloads[name] = { payload: { type: 'object', properties } };
      return;
    }
    payloads[name] = {};
  });
  return payloads;
}

export default extractEventPayloads;
