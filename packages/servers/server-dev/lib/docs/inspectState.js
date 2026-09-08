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

// resolveSource picks the tab or headless — including why `user` is
// headless-only. Falls back to headless whenever the tab path isn't usable
// (no tab connected, or `source: 'tab'` was requested but it errored) so
// agents always get an answer.
async function inspectState({ origin, pageId, source, user }) {
  const { tryTab, error, invalidInput } = resolveSource({
    name: 'inspectState',
    pageId,
    source,
    user,
  });
  if (error) {
    return { error, invalidInput };
  }

  if (tryTab) {
    const result = await inspectStateFromTab({ pageId });
    if (!result?.error) {
      return { ...result, source: 'tab' };
    }
  }

  const result = await inspectStateHeadless({ origin, pageId, user });
  return { ...result, source: 'headless' };
}

export default inspectState;
