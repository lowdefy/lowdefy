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
//
// requestFromTab resolves directly with whatever the tab posted as `result`
// (see tabChannel.js) — a serialized snapshot string on success, or an
// `{ error }` object if no tab is connected, the request timed out, or
// Inspector.jsx itself failed to build the snapshot.
async function inspectStateFromTab({ pageId } = {}) {
  const response = await requestFromTab({ pageId, event: 'inspect-request' });
  if (response?.error) {
    return { error: response.error };
  }
  if (!type.isString(response)) {
    return { error: 'Browser tab responded with an unexpected payload.' };
  }
  return serializer.deserializeFromString(response);
}

export default inspectStateFromTab;
