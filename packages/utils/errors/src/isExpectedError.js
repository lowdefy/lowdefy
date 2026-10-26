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

import expectedErrorNames from './expectedErrorNames.js';

// The one test for "the system worked and said no" (an expected outcome) versus a
// fault. Every site that picks a log level, decides on Sentry or feeds the dev
// agent feed asks this, so a refusal is classified the same way on every route
// and transport. Keyed on the name: a serializer round trip or another package's
// copy of a class keeps the name but not the class identity.
function isExpectedError(error) {
  return expectedErrorNames.has(error?.name);
}

export default isExpectedError;
