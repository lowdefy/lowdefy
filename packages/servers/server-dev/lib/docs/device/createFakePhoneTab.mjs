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

import { serializer } from '@lowdefy/helpers';

import { registerTab, resolveTabRequest, unregisterTab, updateTabPage } from '../tabChannel.js';

// The PNG a fake phone's own view capture answers, base64 as Lowdefy Dev sends it.
const VIEW_PNG = Buffer.from('VIEW-PNG').toString('base64');

/**
 * A stand-in for Lowdefy Dev on the tab channel, for the device tool tests: registered as a phone
 * tab showing `page`, it records every request the dev server sends it and answers each as the
 * shell's dev-tab client does (shell src/dev/tab/createDevTabClient.js), through `answer`.
 *
 * @param {Object} params
 * @param {string} params.id The tab id.
 * @param {Object} params.device `{ shell, platform, app, paired }`.
 * @param {Object} [params.page] `{ pageId, pathParams, instanceKey }` it shows.
 * @param {Object} [params.state] The page state an inspect-request answers with.
 * @param {(event: string, data: Object) => any} [params.answer] Overrides an answer.
 */
function createFakePhoneTab({ id, device, page, state = {}, answer }) {
  const requests = [];
  const pageState = { ...state };
  function defaultAnswer(event, data) {
    switch (event) {
      case 'inspect-request':
        return serializer.serializeToString({ ...page, state: { ...pageState } });
      case 'step-request':
        if (data.step.screenshot !== undefined) {
          return { ok: true, name: data.step.screenshot, image: VIEW_PNG };
        }
        if (data.step.fill !== undefined) {
          pageState[data.step.fill.blockId] = data.step.fill.value;
        }
        return { ok: true, settled: true };
      case 'inject':
        return { ok: true, kind: data.inject.kind };
      default:
        return { error: `Unknown event ${event}.` };
    }
  }
  registerTab({
    id,
    device,
    send: (event, data) => {
      requests.push({ event, data });
      const result = answer?.(event, data) ?? defaultAnswer(event, data);
      setTimeout(() => resolveTabRequest({ requestId: data.requestId, result }), 0);
    },
  });
  if (page !== undefined) {
    updateTabPage({ id, ...page });
  }
  return {
    requests,
    pageState,
    close: () => unregisterTab({ id }),
  };
}

export { VIEW_PNG };
export default createFakePhoneTab;
