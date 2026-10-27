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

import { callerHash, type } from '@lowdefy/helpers';

// True when the server answered as another caller than the one this page
// renders: stamp is the response's parsed x-lowdefy-caller header (see the
// server's stampCaller and parseCallerStamp), user the rendered caller.
function isOtherCaller({ stamp, user }) {
  // A response with no header was not answered by a route that resolved a
  // caller (it failed before, or came from a proxy), so it claims no caller.
  if (type.isNone(stamp)) {
    return false;
  }
  return stamp.caller !== callerHash({ user });
}

export default isOtherCaller;
