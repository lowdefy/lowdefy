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

import forcedFailureBrand from './forcedFailureBrand.js';

// Brands an error as a forced failure: one a test's fail gate threw on purpose
// (@lowdefy/test-utils' createForcedFailure), so no host reports it as an app error. The brand
// is a registered symbol, not enumerable, so an app's own error cannot carry it by accident, a
// copy of the error does not keep it, and another copy of this package reads the same brand.
function markForcedFailure(error) {
  Object.defineProperty(error, forcedFailureBrand, { value: true });
  return error;
}

export default markForcedFailure;
