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

// The cache a shell keeps for one app and caller. The server filters an app's pages, menus and
// page index by the caller's roles, so pages are kept per app, per person and organisation (the
// caller hash of the server's x-lowdefy-caller stamp) and per set of roles (its roles hash).
// stamp is the parsed stamp of the root response; a response without one is the anonymous caller.
function getCacheKey({ appId, stamp }) {
  return [appId, stamp?.caller ?? '', stamp?.roles ?? ''].join(':');
}

export default getCacheKey;
