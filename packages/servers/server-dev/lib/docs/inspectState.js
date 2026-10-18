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

import findDeviceTab from './device/findDeviceTab.js';
import inspectStateFromTab from './inspectStateFromTab.js';
import inspectStateHeadless from './inspectStateHeadless.js';
import resolveSource from './resolveSource.js';

// `device` names a phone's tab (lowdefy_device list): its live state is read,
// as `source: 'tab'` reads a browser tab, and never falls back to headless,
// which would answer for a different screen than the one asked about.
async function inspectDevice({ name, pageId, pathParams, device, source, user, data }) {
  if (source === 'headless') {
    return {
      error: `${name} reads a phone's live tab when "device" is given; "source" "headless" contradicts it. Leave "source" out, or pass "tab".`,
      invalidInput: true,
    };
  }
  if (!type.isNone(user) || !type.isNone(data)) {
    return {
      error: `${name} cannot apply "${
        type.isNone(user) ? 'data' : 'user'
      }" to a phone: it carries its own session and the app's real database.`,
      invalidInput: true,
    };
  }
  const { tab, error } = findDeviceTab({ device });
  if (!type.isUndefined(error)) {
    return { error, invalidInput: true };
  }
  const result = await inspectStateFromTab({ tabId: tab.id, pageId, pathParams });
  if (!type.isUndefined(result?.error)) {
    return { error: result.error };
  }
  return { ...result, source: 'tab', device: tab.id };
}

// resolveSource picks the tab or headless — including why `user` is
// headless-only. Falls back to headless whenever the tab path isn't usable
// (no tab connected, or `source: 'tab'` was requested but it errored) so
// agents always get an answer.
async function inspectState({ origin, pageId, pathParams, source, user, data, device }) {
  if (!type.isNone(device)) {
    return inspectDevice({ name: 'inspectState', pageId, pathParams, device, source, user, data });
  }
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
    const result = await inspectStateFromTab({ pageId, pathParams });
    if (!result?.error) {
      return { ...result, source: 'tab' };
    }
  }

  const result = await inspectStateHeadless({ origin, pageId, pathParams, user, data });
  return { ...result, source: 'headless' };
}

export default inspectState;
