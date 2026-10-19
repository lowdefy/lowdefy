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

import applySystemTrust from './applySystemTrust.js';
import createEvaluateOperators from './createEvaluateOperators.js';

// The context a CallApi bound to an organization runs its target in: a copy of
// the calling run's context, trusted as a system run bound to that organization
// (and stand-in caller, when one is named). A copy, so the binding holds for
// the target and every call nested in it, and the calling run carries on as
// itself once the call returns. evaluateOperators is rebuilt because the
// parser holds the user it was built with, which is what `_user` reads.
function createBoundSystemContext(context, { organizationId, caller }) {
  const bound = applySystemTrust({ ...context }, { organizationId, caller });
  bound.evaluateOperators = createEvaluateOperators(bound);
  return bound;
}

export default createBoundSystemContext;
