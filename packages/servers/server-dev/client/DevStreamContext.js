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

import { createContext } from 'react';

// The one /api/reload EventSource a dev tab holds, owned by Reload.jsx and
// shared with Inspector.jsx: { source, tabId }. Dev runs on HTTP/1.1, where
// browsers cap connections per host at six and an open event stream holds
// one for the life of the tab. Two streams per tab meant three tabs of the
// same app saturated the pool and the next fetch queued forever, so every
// dev-only channel rides this single stream instead of opening its own.
//   - source: the EventSource, null until Reload's effect has opened it.
//   - tabId: the id the server assigned this connection in its tab registry
//     (lib/docs/tabChannel.js), null until the stream's `tab` event arrives.
const DevStreamContext = createContext({ source: null, tabId: null });

export default DevStreamContext;
