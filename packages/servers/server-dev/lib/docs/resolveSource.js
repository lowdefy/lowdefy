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

import { type } from '@lowdefy/helpers';

import tabAvailable from './tabAvailable.js';

// The single tab-vs-headless decision, shared by inspectState and evalOperator
// so a change to the rule lands in both. Prefers a real, already-open browser
// tab over a fresh headless one — a live tab reflects whatever a developer is
// actually looking at (their own interactions, in-flight requests), while
// headless always starts a clean navigation.
//
// `user` is headless-only — the developer's tab carries their real session,
// which the dev server cannot re-identify — so it selects the headless source,
// and contradicts an explicit `source: 'tab'`.
//
// Returns { tryTab }, or { error, invalidInput } for a contradictory call.
// `invalidInput` marks the caller's own mistake rather than a failed render, so
// the HTTP routes can answer 400 instead of a 502 that reads as "the renderer
// broke, retry".
function resolveSource({ name, pageId, source, user }) {
  const hasUser = !type.isNone(user);
  if (hasUser && source === 'tab') {
    return {
      error: `${name} cannot apply "user" to the developer's live tab — it carries their real session. Omit "source", or use "headless".`,
      invalidInput: true,
    };
  }
  return {
    tryTab: source === 'tab' || (source === undefined && !hasUser && tabAvailable({ pageId })),
  };
}

export default resolveSource;
