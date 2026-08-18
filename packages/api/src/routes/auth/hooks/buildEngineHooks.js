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

import createActiveOrgPolicyHook from '../organizations/createActiveOrgPolicyHook.js';
import createAdmissionGateHook from '../organizations/createAdmissionGateHook.js';
import createAutoJoinHook from '../organizations/createAutoJoinHook.js';

// Engine-tier hook bindings - hard-coded framework behavior, not entries in
// auth.hooks. Keyed by point; each point lists BetterAuth-native callbacks
// (before: (data, ctx) => false | { data } | undefined, after: (data, ctx)).
// Engine hooks run first in each composed slot, so the user hook sees the
// engine-normalized record. Config parameterizes the membership behaviors
// (policy, signup) but they are not user-pluggable.
function buildEngineHooks({ authConfig, getAuth, logger }) {
  const organizations = authConfig.organizations;

  const engineHooks = {
    'session.create.before': [createActiveOrgPolicyHook({ getAuth, logger, organizations })],
  };

  // The admission gate bites only under pinned + invite-only (the predicate
  // admits everyone otherwise), so it is bound only there. It is the first - and
  // only - engine binding on user.create.before, so it runs ahead of the
  // module-contributed merge-on-signup hook: an unadmitted create is vetoed
  // before merge runs, and no orphan contact is linked or created.
  if (organizations.policy === 'pinned' && organizations.signup === 'invite-only') {
    engineHooks['user.create.before'] = [createAdmissionGateHook({ getAuth, organizations })];
  }

  if (organizations.policy === 'pinned' && organizations.signup === 'open') {
    engineHooks['user.create.after'] = [createAutoJoinHook({ getAuth, organizations })];
  }

  return engineHooks;
}

export default buildEngineHooks;
