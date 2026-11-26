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

// The authorization gate a server builds for one caller, from the server's own @lowdefy/api.
// The caller is injected, as a journey's user is: no auth engine runs, and
// createInjectedApiContext takes the organization policy and the enforcement facts from the
// built auth.json. user is a data set user, or null for a signed out caller.
function createCallerGate({ testApp, user }) {
  const { createInjectedApiContext, normalizeInjectedCaller } = testApp.modules.api;
  const context = {
    auth: null,
    buildDirectory: testApp.directories.build,
    fileCache: testApp.fileCache,
    headers: {},
    user: type.isNone(user) ? null : normalizeInjectedCaller(user),
  };
  createInjectedApiContext(context, { authJson: testApp.authJson });
  return context.authorizeOutcome;
}

export default createCallerGate;
