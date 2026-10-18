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

import findPageContext from './findPageContext.js';

/**
 * The answer to a load-state-request (server-dev lib/docs/loadState.js, with a device): sets each
 * key of a state checkpoint on the page instance's state and re-renders it, as the dev server does
 * in its headless browser, then reads back the first `verify` keys so the agent sees they landed.
 * Answers `{ verifiedKeys }`, or `{ error }` as a browser tab words it.
 */
function answerLoadState({ lowdefy, page, state, verify = 3 }) {
  if (!type.isObject(state)) {
    return {
      error: `A load-state-request needs the state as an object. Received ${JSON.stringify(
        state
      )}.`,
    };
  }
  const { context, error } = findPageContext({ lowdefy, page });
  if (error) {
    return { error };
  }
  const entries = Object.entries(state);
  entries.forEach(([key, value]) => {
    context._internal.State.set(key, value);
  });
  context._internal.update();
  const verifiedKeys = Object.fromEntries(
    entries.slice(0, verify).map(([key]) => [key, context.state?.[key]])
  );
  return { verifiedKeys };
}

export default answerLoadState;
