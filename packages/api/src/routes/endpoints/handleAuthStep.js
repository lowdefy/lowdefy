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
import getUserAdminRole from '../auth/getUserAdminRole.js';

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

  // A resolved caller is context.user carrying an id - hook routines run
  // with context.user = {}, which is a caller-less system invocation unless
  // the step explicitly opts into running as the system.
  const hasCaller = type.isObject(context.user) && !type.isNone(context.user.id);
  if (!hasCaller && step.system !== true) {
    throw new ConfigError(
      `Auth step "${step.stepId}" requires an authenticated caller. Set system: true on the step for caller-less system routines.`,
      { configKey: step['~k'] }
    );
  }

  // system: true is an explicit trust decision, not attribution - the step
  // runs caller-less as the system even when a caller is present.
  const acting =
    step.system === true ? { system: true, user: null } : { system: false, user: context.user };

  // The user-administration floor, enforced mechanically here so an app can
  // never expose member mutation by forgetting a check: every user-initiated
  // auth step requires the resolved caller to hold the auth.userAdminRole
  // member role. System invocations run caller-less and pass. A step may
  // declare a self-targeting exemption (meta.selfTargetExempt names the
  // property compared to the caller's own id) - today only UpdateUserProfile,
  // whose self-service profile save carries no authorization inputs.
  const userAdminRole = getUserAdminRole({ auth: context.auth });
  if (acting.system !== true) {
    const selfTargetKey = stepFn.meta?.selfTargetExempt;
    const selfTargeted =
      !type.isNone(selfTargetKey) && evaluatedProperties?.[selfTargetKey] === context.user.id;
    if (!selfTargeted) {
      if (type.isNone(userAdminRole)) {
        throw new ConfigError(
          `Auth step "${step.stepId}" refused - "auth.userAdminRole" is not configured. The app must declare which member role administers users; caller-less system routines (system: true) are unaffected.`,
          { configKey: step['~k'] }
        );
      }
      if (!(context.user.roles ?? []).includes(userAdminRole)) {
        throw new ConfigError(
          `Auth step "${step.stepId}" refused - the caller does not hold the user-admin role configured in "auth.userAdminRole".`,
          { configKey: step['~k'] }
        );
      }
    }
  }

  // The retained organizations state ({ policy, pinned }) - org-scoped steps
  // default an omitted organizationId from it. The configured user-admin role
  // rides along for the steps that sync the user.role denormalization.
  const result = await stepFn({
    acting,
    auth: context.auth,
    organization: context.organization ?? null,
    properties: evaluatedProperties,
    userAdminRole,
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
