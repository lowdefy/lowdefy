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

// Lowdefy schemas describe the JSON shape a value has once it reaches a
// consumer, not the in-process object: a Date is `{ type: string, format:
// date-time }` on every surface. Validation therefore runs on the value's JSON
// projection - exactly what JSON.stringify produces, so a Date becomes its ISO
// string and a BSON ObjectId its hex string, the same values an MCP client or
// a browser observes. Doing it here, rather than teaching ajv about Date, keeps
// one schema truthful on both sides of the serialize boundary.
function toJsonShape({ value }) {
  if (type.isUndefined(value)) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

export default toJsonShape;
