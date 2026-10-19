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

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addKeywords from 'ajv-keywords';
import ajvErrors from 'ajv-errors';

// Cap on the error objects a generated validator retains.
// `allErrors: true` is required for ajv-errors (errorMessage:), but without a
// cap an attacker can make Ajv allocate an unbounded number of error objects
// (CodeQL js/resource-exhaustion-from-deep-object-traversal). The code.process
// hook below truncates each validator's error array at this threshold, bounding
// retained memory at ~MAX_VALIDATION_ERRORS * ~500 bytes per validate() call.
const MAX_VALIDATION_ERRORS = 20;

// Ajv 8 emits the exact pattern `errors++;` after every error push (see
// ajv/lib/compile/errors.ts addError), which makes it the one hook point that
// sees every allocation. Truncate there; never early-exit. A `oneOf`/`anyOf` is
// only decided once every branch has been tried, and each branch that rejects
// the data pushes an error per item it rejects — so returning false at the cap
// abandoned the walk before the branch that would have matched was reached. A
// `oneOf` of differently-typed arrays then rejected any list longer than a
// handful of entries whatever it held, since the earlier branches alone spent
// the budget. Counting is left alone, so `errors === 0` still decides validity
// and only the retained objects are bounded.
function capErrors(code) {
  return code.replace(
    /errors\+\+;/g,
    `errors++;if(vErrors!==null&&vErrors.length>${MAX_VALIDATION_ERRORS}){vErrors.length=${MAX_VALIDATION_ERRORS};}`
  );
}

const ajv = new Ajv({
  // codeql[js/resource-exhaustion-from-deep-object-traversal] -- bounded by capErrors() above
  allErrors: true,
  strict: false,
  code: { process: capErrors },
});

// Order matters: format and keyword definitions must be registered before
// ajv-errors so the errorMessage keyword can attach to them.
addFormats(ajv);
// `instanceof` — match JS class instances (e.g. `instanceof: 'Date'`).
// `transform`  — normalise string values mid-validation (`transform: [trim, toUpperCase]`).
// `regexp`     — `pattern:` with regex flags (`regexp: '/^l[0-9]+$/i'`).
addKeywords(ajv, ['instanceof', 'transform', 'regexp']);
ajvErrors(ajv);

export { MAX_VALIDATION_ERRORS };
export default ajv;
