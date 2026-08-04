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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';
import authorizeRole from '../auth/organizations/authorizeRole.js';
import resolveStepOrganizationId from './resolveStepOrganizationId.js';

// Refusals name what was asked for, because "refused" with no subject is the
// failure people report: { member: ['update'] } reads as "member: [update]".
function describePermissions(permissions) {
  return Object.entries(permissions ?? {})
    .map(([resource, actions]) => `${resource}: [${(actions ?? []).join(', ')}]`)
    .join(', ');
}

async function handleAuthStep(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_auth_step',
    step,
  });

  // Evaluate operators in step.properties before resolving the step type, so
  // a malformed properties block surfaces the same way it does for every
  // other step type.
  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });

  const stepFn = context.steps?.[step.type];
  if (type.isNone(stepFn)) {
    throw new ConfigError(`Auth step type "${step.type}" is not defined.`, {
      configKey: step['~k'],
    });
  }

  // Checked before the caller - an auth-less app should hear "no auth
  // engine", not a misleading missing-caller error.
  if (type.isNone(context.auth)) {
    throw new ConfigError(
      `Auth step "${step.stepId}" requires the auth engine - auth is not configured (or dev.mockUser is active).`,
      { configKey: step['~k'] }
    );
  }

  // The floor passes on either of two independent doors (Decision 1):
  //   1. a run-level system context (context.system === true) - a trusted,
  //      caller-less run (cron, hook, verified webhook), or
  //   2. a single step marked system (step.system === true, admin's
  //      skipUserAdminRoleCheck) - a per-step waiver in an otherwise
  //      user/public run, which never sets context.system.
  // Either door makes the step act caller-less as the system.
  const actingAsSystem = context.system === true || step.system === true;

  // A resolved caller is context.user carrying an id. A caller-less run needs
  // no principal only when one of the two system doors is open.
  const hasCaller = type.isObject(context.user) && !type.isNone(context.user.id);
  if (!hasCaller && !actingAsSystem) {
    throw new ConfigError(
      `Auth step "${step.stepId}" requires an authenticated caller. Set system: true on the step for caller-less system routines.`,
      { configKey: step['~k'] }
    );
  }

  // Acting as the system is an explicit trust decision, not attribution - the
  // step runs caller-less as the system (even when a caller is present, for
  // the per-step marker).
  const acting = actingAsSystem
    ? { system: true, user: null }
    : { system: false, user: context.user };

  // The user-administration floor. It is per-step and per-scope: each step
  // declares the authority it requires in meta.authority, and the floor
  // enforces it mechanically here so an app can never expose member mutation
  // by forgetting a check. Only six of the fifteen steps call an organization
  // plugin endpoint; the other nine go adapter-direct or through the admin
  // plugin, whose check reads a deployment-wide user.role and structurally
  // cannot answer "is the caller an administrator of THIS organization". For
  // those nine, no check that can express per-organization authority runs
  // anywhere else - the floor is their only authorization.
  const authority = stepFn.meta?.authority;
  if (type.isNone(authority)) {
    throw new ConfigError(
      `Auth step "${step.stepId}" of type "${step.type}" declares no "meta.authority" - every auth step must declare the authority it requires.`,
      { configKey: step['~k'] }
    );
  }

  // A system-scoped step has no organization to be authorized in, so a caller
  // can never satisfy it - it runs only where the run itself is trusted.
  if (authority.scope === 'system' && acting.system !== true) {
    throw new ConfigError(
      `Auth step "${step.stepId}" may only run in a caller-less system routine. Set system: true on the step, or run it from a system context.`,
      { configKey: step['~k'] }
    );
  }

  // Resolved for every org-scoped step, including the ones acting as the
  // system: the step is told which organization it writes in rather than
  // working it out again, so the organization the floor authorized and the
  // organization the step writes into cannot drift apart.
  const organizationId =
    authority.scope === 'org'
      ? await resolveStepOrganizationId({
          auth: context.auth,
          configKey: step['~k'],
          organization: context.organization,
          properties: evaluatedProperties,
          stepId: step.stepId,
        })
      : null;

  // Both system doors bypass the checks below - acting as the system is the
  // trust decision, and an author-declared step.system is an escape hatch
  // visible in a diff. Reaching the block means acting.system !== true, so the
  // system-scope refusal above and this branch are exclusive.
  if (authority.scope === 'org' && acting.system !== true) {
    // Evaluated before the scope check: a person saves their own profile
    // without holding any org authority, and without holding a member row in
    // the organization the request happens to name.
    const selfTargetKey = authority.selfTargetExempt;
    const selfTargeted =
      !type.isNone(selfTargetKey) && evaluatedProperties?.[selfTargetKey] === context.user.id;
    if (!selfTargeted) {
      const { adapter } = await context.auth.$context;
      // The caller's authority is their member row in the TARGET organization,
      // which is the same question the organization endpoint would ask, asked
      // one layer earlier so the adapter-direct and admin-plugin steps get it
      // too.
      const callerMember = await adapter.findOne({
        model: 'member',
        where: [
          { field: 'userId', value: context.user.id },
          { field: 'organizationId', value: organizationId },
        ],
      });
      if (
        type.isNone(callerMember) ||
        !authorizeRole({ permissions: authority.permissions, role: callerMember.role })
      ) {
        throw new ConfigError(
          `Auth step "${step.stepId}" refused - the caller does not hold ${describePermissions(
            authority.permissions
          )} in organization "${organizationId}".`,
          { configKey: step['~k'] }
        );
      }
      // A step that writes the user row reaches a row shared by the whole
      // deployment, so org authority alone would let an administrator of any
      // organization reach any user. Membership in the same organization is
      // what makes the target the caller's business. Steps that write a member
      // row declare no targetUser - their target is already a row there. An
      // absent property is the step's own required-property error, so leave it
      // to the step.
      const targetId = type.isNone(authority.targetUser)
        ? undefined
        : evaluatedProperties?.[authority.targetUser];
      if (!type.isNone(targetId)) {
        const targetMember = await adapter.findOne({
          model: 'member',
          where: [
            { field: 'userId', value: targetId },
            { field: 'organizationId', value: organizationId },
          ],
        });
        if (type.isNone(targetMember)) {
          throw new ConfigError(
            `Auth step "${step.stepId}" refused - user "${targetId}" is not a member of organization "${organizationId}".`,
            { configKey: step['~k'] }
          );
        }
      }
    }
  }

  // organization is the retained organizations state ({ policy, pinned }) -
  // steps read policy for their own messages. organizationId is the resolved
  // target, which is what a step scopes its write to.
  const result = await stepFn({
    acting,
    auth: context.auth,
    organization: context.organization ?? null,
    organizationId,
    properties: evaluatedProperties,
  });

  addStepResult(context, routineContext, {
    result,
    stepId: step.stepId,
  });

  logger.debug({
    event: 'debug_end_auth_step',
    stepId: step.stepId,
    type: step.type,
  });

  return { status: 'continue' };
}

export default handleAuthStep;
