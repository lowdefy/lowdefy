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

// Evaluates an operator expression against the live client state of a page
// open in a developer's real browser tab (e.g. `{ _state: 'myInput' }`),
// using the page's own WebParser instance so results match runtime exactly.
//
// requestFromTab resolves directly with whatever the tab posted as `result`
// (see tabChannel.js) — `{ value, errors }` on success, or an `{ error }`
// object if no tab is connected, the request timed out, or Inspector.jsx
// itself failed to evaluate the expression.
async function evalOperatorInTab({ pageId, expression }) {
  if (type.isNone(expression)) {
    throw new Error('evalOperatorInTab requires an "expression".');
  }
  const response = await requestFromTab({
    pageId,
    event: 'eval-request',
    payload: { expression },
  });
  if (response?.error) {
    return { error: response.error };
  }
  const { value, errors } = response;
  return {
    value: type.isUndefined(value) ? undefined : serializer.deserializeFromString(value),
    errors,
  };
}

export default evalOperatorInTab;
