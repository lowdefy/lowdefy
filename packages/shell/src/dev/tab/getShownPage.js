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
import { getTrace } from '@lowdefy/engine';

// The page instance the shell shows, `{ pageId, pathParams, instanceKey }`, read from the route the
// focused screen set (host globals), as the trace reads it. A screen's page context is keyed by its
// route instance too (engine getContext), so the key ends in `@{instanceId}`. Null before the first
// page renders.
function getShownPage(lowdefy) {
  const globals = lowdefy?._internal?.globals;
  if (type.isNone(globals)) {
    return null;
  }
  const entry = getTrace(lowdefy).pathEntryOf(globals.window.location.href);
  if (type.isNone(entry)) {
    return null;
  }
  // Only the shell's own globals know the focused screen; a page rendered without one has one
  // context per page instance.
  const instanceId = globals.shownScreen?.instanceId;
  const instanceKey = type.isNone(instanceId)
    ? entry.instanceKey
    : `${entry.instanceKey}@${instanceId}`;
  return { pageId: entry.pageId, pathParams: entry.pathParams, instanceKey };
}

export default getShownPage;
