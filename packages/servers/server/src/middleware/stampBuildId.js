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

// Stamps the server's build on auth responses. Auth calls are not refused on a
// mismatch (they are Lowdefy's routes, not app config, and a session refetch on
// window focus would reload away unsaved input); instead the client reloads
// when an auth call fails and this header shows a newer build answered
// (lib/client/auth/fetchCheckingBuild.js). Set after next() so error responses
// and the raw responses BetterAuth returns carry it too.
function stampBuildId({ buildId }) {
  return async function stampBuildIdMiddleware(c, next) {
    await next();
    c.header('x-lowdefy-build', buildId);
  };
}

export default stampBuildId;
