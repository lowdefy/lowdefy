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

import createAuthorizeOutcome from './createAuthorizeOutcome.js';

// The single writer of the trusted, caller-less system-context invariants
// (Decision 1). It sets all three together on an existing context so no caller
// can set one without the others:
//   - user: null      — caller-less (detectable via type.isNone)
//   - system: true     — the run-level trust marker every authorization layer reads
//   - authorizeOutcome — derived from createAuthorizeOutcome so it reads context.system
// createSystemContext builds a FRESH context for the off-request hook path;
// this applies the same state to a request context a runner already holds
// (cron at construction, webhook once its verify gate passes, a detached run
// whose dispatcher was itself a system context). One greppable place means a
// future runner cannot reintroduce the silent-no-op bug by forgetting a line.
function applySystemTrust(context) {
  context.user = null;
  context.system = true;
  context.authorizeOutcome = createAuthorizeOutcome(context);
  return context;
}

export default applySystemTrust;
