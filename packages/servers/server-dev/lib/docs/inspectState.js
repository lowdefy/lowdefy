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

import inspectStateFromTab from './inspectStateFromTab.js';
import inspectStateHeadless from './inspectStateHeadless.js';
import resolveSource from './resolveSource.js';

// Reads a running page: its state snapshot, or, when an expression is passed,
// the value of that operator expression against its live state.
// resolveSource picks the tab or headless — including why `user` is
// headless-only. Falls back to headless whenever the tab path isn't usable
// (no tab connected, or `source: 'tab'` was requested but it errored) so
// agents always get an answer.
async function inspectState(params) {
  const { origin, pageId, pathParams, expression, source, user, data } = params;
  // null is a valid expression, so whether one was passed is read from the key.
  const evaluate = Object.hasOwn(params, 'expression');
  const { tryTab, error, invalidInput } = resolveSource({
    name: 'inspectState',
    pageId,
    pathParams,
    source,
    user,
    data,
  });
  if (error) {
    return { error, invalidInput };
  }

  if (tryTab) {
    const result = await inspectStateFromTab({ pageId, pathParams, evaluate, expression });
    if (!result?.error) {
      return { ...result, source: 'tab' };
    }
  }

  const result = await inspectStateHeadless({
    origin,
    pageId,
    pathParams,
    evaluate,
    expression,
    user,
    data,
  });
  return { ...result, source: 'headless' };
}

export default inspectState;
