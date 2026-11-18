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

// Whether a request is the one a stub or gate names. `requestId` is the request's id on a page
// or its step id in an endpoint routine; `endpoint` and `pageId` narrow it when two routines
// share a request id. A key the entry leaves out matches any request.
function matchesRequestKey({ entry, request }) {
  if (!type.isNone(entry.requestId) && entry.requestId !== request.requestId) return false;
  if (!type.isNone(entry.endpoint) && entry.endpoint !== request.endpointId) return false;
  if (!type.isNone(entry.pageId) && entry.pageId !== request.pageId) return false;
  return true;
}

export default matchesRequestKey;
