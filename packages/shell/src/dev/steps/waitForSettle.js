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

import findPageContext from '../tab/findPageContext.js';
import getShownPage from '../tab/getShownPage.js';
import isContextSettled from './isContextSettled.js';
import waitUntil from './waitUntil.js';

// Waits, at most `timeout` ms, for the page the shell shows (it may have changed: a click can open
// another page) to finish what an interaction started. True once settled; false when it is still
// busy, which, as in the browser runner, does not fail the step.
async function waitForSettle({ lowdefy, timeout }) {
  const settled = await waitUntil({
    timeout,
    check: () => {
      const { context } = findPageContext({ lowdefy, page: getShownPage(lowdefy) });
      if (context === undefined || !isContextSettled({ context, lowdefy })) {
        return undefined;
      }
      return true;
    },
  });
  return settled === true;
}

export default waitForSettle;
