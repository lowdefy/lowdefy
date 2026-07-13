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

import evalOperatorInTab from './evalOperatorInTab.js';
import evalOperatorHeadless from './evalOperatorHeadless.js';
import tabAvailable from './tabAvailable.js';

// Prefers a real, already-open browser tab over a fresh headless one - see
// inspectState.js for the rationale. Falls back to headless whenever the tab
// path isn't usable (no tab connected, or `source: 'tab'` was requested but
// it errored) so agents always get an answer.
async function evalOperator({ origin, pageId, expression, source }) {
  const shouldTryTab = source === 'tab' || (source === undefined && tabAvailable({ pageId }));

  if (shouldTryTab) {
    const result = await evalOperatorInTab({ pageId, expression });
    if (!result?.error) {
      return { ...result, source: 'tab' };
    }
  }

  const result = await evalOperatorHeadless({ origin, pageId, expression });
  return { ...result, source: 'headless' };
}

export default evalOperator;
