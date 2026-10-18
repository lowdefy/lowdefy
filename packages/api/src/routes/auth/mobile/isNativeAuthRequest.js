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

// A request from a phone shell's own code: an HTTP request carrying neither an
// Origin nor a Cookie header. A browser sends Origin on every fetch that can
// change state and its cookies on every same-origin request, and page script
// can remove neither, so a browser's script never counts as native. Shells
// keep no cookie jar (they send the session as a bearer), so their requests
// carry no Cookie.
function isNativeAuthRequest({ request }) {
  if (type.isNone(request)) {
    return false;
  }
  return !request.headers.has('origin') && !request.headers.has('cookie');
}

export default isNativeAuthRequest;
