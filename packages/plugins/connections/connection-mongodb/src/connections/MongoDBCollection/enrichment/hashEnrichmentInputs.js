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

import canonicalJson from './canonicalJson.js';
import cyrb53 from './cyrb53.js';

// The hash of the inputs an enrichment cell is computed from, stored as
// `_enrich.<key>.inputHash`. A cell is stale when the hash of its row's current inputs
// differs. The Table computes it in the browser too, so both must give the same text for the
// same inputs: cyrb53 (seed 0) of the canonical JSON, as 14 lowercase hex digits.
function hashEnrichmentInputs(inputs) {
  const text = canonicalJson(inputs) ?? 'null';
  return cyrb53(text).toString(16).padStart(14, '0');
}

export default hashEnrichmentInputs;
