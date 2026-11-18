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

// Whether an error is a forced failure a test's fail gate threw (markForcedFailure). Only the
// brand counts: a plain `forced` property, which any error could carry, does not.
function isForcedFailure(error) {
  return error?.[forcedFailureBrand] === true;
}

export default isForcedFailure;
