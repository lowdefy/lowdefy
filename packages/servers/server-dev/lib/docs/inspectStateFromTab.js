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

import { type, serializer } from '@lowdefy/helpers';

import { requestFromTab } from './tabChannel.js';

// Reads the live state of a page open in a developer's real browser tab, via
// the SSE + POST /api/dev-inspect round trip set up in Inspector.jsx. Lets an
// agent inspect actual client state (not just what the build would produce).
// With evaluate, the tab evaluates the expression with the page's own
// WebParser instead, so results match runtime exactly.
//
// requestFromTab resolves directly with whatever the tab posted as `result`
// (see tabChannel.js) — a serialized snapshot string, or `{ value, errors,
// reads }` for an expression, on success; an `{ error }` object if no tab is
// connected, the request timed out, or Inspector.jsx itself failed. `tabId`
// asks one tab (a phone in Lowdefy Dev answers in the same shapes), else the
// tab showing the page.
async function inspectStateFromTab({
  tabId,
  pageId,
  pathParams,
  evaluate = false,
  expression,
} = {}) {
  if (evaluate) {
    return evaluateInTab({ tabId, pageId, pathParams, expression });
  }
  const response = await requestFromTab({ tabId, pageId, pathParams, event: 'inspect-request' });
  if (response?.error) {
    return { error: response.error };
  }
  if (!type.isString(response)) {
    return { error: 'The tab responded with an unexpected payload.' };
  }
  return serializer.deserializeFromString(response);
}

async function evaluateInTab({ tabId, pageId, pathParams, expression }) {
  const response = await requestFromTab({
    tabId,
    pageId,
    pathParams,
    event: 'eval-request',
    payload: { expression },
  });
  if (response?.error) {
    return { error: response.error };
  }
  const { value, errors, reads } = response;
  return {
    value: type.isUndefined(value) ? undefined : serializer.deserializeFromString(value),
    errors,
    reads,
  };
}

export default inspectStateFromTab;
