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

import { ConfigError } from '@lowdefy/errors';

// Build the phase-boundary assertion that fails a render on any recorded action
// error. The first error is the cause so its configKey (the action or request
// the error came from) resolves to a config location in the logs; the count
// tells the reader whether it stopped at one failure or several.
function createAssertNoActionErrors({ actionErrors, pageId }) {
  return function assertNoActionErrors(phase) {
    if (actionErrors.length === 0) return;
    const [first] = actionErrors;
    const count = actionErrors.length;
    const noun = count === 1 ? 'action' : 'actions';
    throw new ConfigError(
      `Report for page '${pageId}' failed: ${count} ${noun} errored during ${phase}: ${first.message}`,
      { cause: first }
    );
  };
}

export default createAssertNoActionErrors;
