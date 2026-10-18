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

import { parseCallerStamp, type } from '@lowdefy/helpers';

// Keeps the last caller stamp a response carried (see the server's stampCaller)
// on lowdefy._internal.callerStamp, as { caller, session, roles, memberships }:
// who the server last answered as, in full. A response with no header claims
// no caller and leaves the last stamp in place.
function recordCallerStamp({ lowdefy, serverCaller }) {
  const stamp = parseCallerStamp(serverCaller);
  if (type.isNone(stamp)) {
    return;
  }
  // The dev server fetches the first page config before the page context exists
  // (initLowdefyContext), which carries this stamp over when it builds
  // _internal.
  lowdefy._internal = lowdefy._internal ?? {};
  lowdefy._internal.callerStamp = stamp;
}

export default recordCallerStamp;
