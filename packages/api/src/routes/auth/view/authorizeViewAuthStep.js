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

import { AuthorizationError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import authorizeViewWrite from './authorizeViewWrite.js';

// The auth steps that only read: they list members or users and change
// nothing. Named here, where the rule is, because a step declares no such
// thing itself - its meta.authority says whose authority it needs, not whether
// it writes. A step type not named reads as a write, so a step added later is
// closed to a read-only grant until it is listed.
const READ_STEPS = new Set(['ListMembers', 'ListUsers']);

// The auth steps that hand the caller a credential or a session of their own.
// CreateMcpToken returns a member token that can be made never to expire: it
// would outlive the view session and the grant it was minted from, so no scope
// of that grant can allow it.
const CREDENTIAL_STEPS = new Set(['CreateMcpToken']);

// An auth step in a routine runs on the caller's authority in their
// organization, and all but the list steps change state: invitations, roles,
// suspensions, bans, deletions, revoked sessions, passkeys, tokens and grants.
// An endpoint a view page calls is listed for it whatever its routine does, so
// the steps are held to the view session here, as the request steps are
// (authorizeViewRequestResolver):
//
// - a step that issues a credential is refused to every view session;
// - a list step runs on a read-only grant;
// - every other step is a write and needs mcp:write (view_write_required).
//
// Applied to a step marked system and to a run bound as the system too: the
// view session started the run, and its grant caps what the run does.
//
// A caller that is not a view session is never refused here.
function authorizeViewAuthStep(context, { step }) {
  const { logger, viewSession } = context;
  if (type.isNone(viewSession)) {
    return;
  }
  if (CREDENTIAL_STEPS.has(step.type)) {
    logger.debug(
      { event: 'debug_view_auth_step_refused', stepId: step.stepId, type: step.type },
      `View session refused on auth step "${step.stepId}": "${step.type}" issues a credential.`
    );
    throw new AuthorizationError(
      `Auth step "${step.stepId}" refused - "${step.type}" cannot run for a view session.`
    );
  }
  if (READ_STEPS.has(step.type)) {
    return;
  }
  authorizeViewWrite(context, { subject: `auth step "${step.stepId}"` });
}

export default authorizeViewAuthStep;
export { CREDENTIAL_STEPS, READ_STEPS };
