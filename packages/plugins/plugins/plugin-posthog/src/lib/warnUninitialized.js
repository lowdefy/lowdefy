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

import postHogState from './postHogState.js';

// A PostHog action running before PostHogInit is a config mistake, but
// analytics must never throw, so the browser console is the only place left to
// report it. Once is enough to point at the fix without flooding the console.
function warnUninitialized({ action }) {
  if (postHogState.warnedUninitialized) return;
  postHogState.warnedUninitialized = true;
  // eslint-disable-next-line no-console
  console.warn(
    `${action} ran before PostHogInit, so it did nothing. Run PostHogInit in the page onInit event, with "enabled: false" where analytics should be off.`
  );
}

export default warnUninitialized;
