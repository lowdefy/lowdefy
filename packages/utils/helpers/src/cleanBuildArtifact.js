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

import serializer from './serializer.js';

// Build artifacts carry serializer markers (~k, ~r, ~l) and wrap location-marked
// arrays as { '~arr': [...], '~k': '...' }. serializer.deserialize un-wraps
// ~arr back to a plain array and demotes markers to non-enumerable properties;
// the subsequent JSON round-trip drops those non-enumerable markers, leaving a
// plain structure (e.g. a payloadSchema as plain JSON Schema).
function cleanBuildArtifact(obj) {
  return JSON.parse(JSON.stringify(serializer.deserialize(obj)));
}

export default cleanBuildArtifact;
