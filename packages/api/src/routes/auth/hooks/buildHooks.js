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

import { set, type } from '@lowdefy/helpers';
import { LowdefyInternalError } from '@lowdefy/errors';

import authHookPoints from './authHookPoints.js';
import buildEngineHooks from './buildEngineHooks.js';
import composeAfterSlot from './composeAfterSlot.js';
import composeBeforeSlot from './composeBeforeSlot.js';
import createHookDispatch from './createHookDispatch.js';
import createUserAfterHook from './createUserAfterHook.js';
import createUserBeforeHook from './createUserBeforeHook.js';

// Assembles BetterAuth's databaseHooks and the synthetic points' backing
// callbacks from the engine-tier bindings and the validated auth.hooks
// entries. Each point resolves to one composed slot with engine hooks first,
// then every user hook bound to the point in array order - the build orders
// the array as module contributions first, then app entries, so array order
// IS the tier order. Build validation guarantees every entry binds a known
// point to an existing InternalApi endpoint; one endpoint may bind several
// points.
function buildHooks({ authConfig, createSystemContext, getAuth }) {
  const userHooks = {};
  (authConfig.hooks ?? []).forEach((hook) => {
    if (type.isNone(userHooks[hook.point])) {
      userHooks[hook.point] = [];
    }
    userHooks[hook.point].push(hook);
  });

  if (Object.keys(userHooks).length > 0 && type.isNone(createSystemContext)) {
    throw new LowdefyInternalError(
      'Auth hooks are configured but no createSystemContext factory was provided to getBetterAuthConfig.'
    );
  }

  const engineHooks = buildEngineHooks({ authConfig, getAuth });

  const databaseHooks = {};
  let afterEmailVerification;
  let phoneVerified;
  let sendPhoneOtp;
  let sendPhonePasswordResetOtp;

  const points = new Set([...Object.keys(engineHooks), ...Object.keys(userHooks)]);
  points.forEach((point) => {
    const pointDef = authHookPoints[point];

    const hooks = [...(engineHooks[point] ?? [])];
    (userHooks[point] ?? []).forEach((userHook) => {
      const dispatch = createHookDispatch({ createSystemContext, getAuth, hook: userHook });
      hooks.push(
        pointDef.timing === 'before'
          ? createUserBeforeHook({ dispatch, hook: userHook })
          : createUserAfterHook({ dispatch })
      );
    });

    if (pointDef.kind === 'database') {
      const slot =
        pointDef.timing === 'before' ? composeBeforeSlot({ hooks }) : composeAfterSlot({ hooks });
      set(databaseHooks, `${pointDef.model}.${pointDef.operation}.${pointDef.timing}`, slot);
    }
    if (point === 'email.verified') {
      afterEmailVerification = composeAfterSlot({ hooks });
    }
    if (point === 'phone.otp.send') {
      sendPhoneOtp = composeAfterSlot({ hooks });
    }
    if (point === 'phone.passwordReset.send') {
      sendPhonePasswordResetOtp = composeAfterSlot({ hooks });
    }
    if (point === 'phone.verified') {
      phoneVerified = composeAfterSlot({ hooks });
    }
  });

  return {
    afterEmailVerification,
    databaseHooks,
    phoneVerified,
    sendPhoneOtp,
    sendPhonePasswordResetOtp,
  };
}

export default buildHooks;
