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

import cyrb53 from './cyrb53.js';
import toCanonicalJson from './toCanonicalJson.js';

// The `inputHash` of an enrichment cell: cyrb53 (seed 0) of the canonical JSON of the resolved
// inputs (toCanonicalJson.js), as lowercase hex zero-padded to 14 characters. The MongoDB
// enrichment requests compute the same hash on the server, so a cell is stale exactly when the
// browser's hash of the row's current inputs differs from the one stored with its value. Both
// sides test against the fixture in test/enrichmentInputHash.json.
function hashEnrichmentInputs(inputs) {
  return cyrb53(toCanonicalJson(inputs), 0).toString(16).padStart(14, '0');
}

export default hashEnrichmentInputs;
