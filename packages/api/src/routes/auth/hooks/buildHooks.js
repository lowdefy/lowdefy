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
import composeAfterSlot from './composeAfterSlot.js';
import composeBeforeSlot from './composeBeforeSlot.js';
import createHookDispatch from './createHookDispatch.js';
import createUserAfterHook from './createUserAfterHook.js';
import createUserBeforeHook from './createUserBeforeHook.js';
import engineHooks from './engineHooks.js';

// Assembles BetterAuth's databaseHooks and the synthetic points' backing
// callbacks from the engine-tier bindings and the validated auth.hooks
// entries. Each point resolves to one composed slot with engine hooks first,
// then the single user hook. Build validation guarantees every entry binds a
// known point, at most once, to an existing InternalApi endpoint.
function buildHooks({ authConfig, createSystemContext, logger }) {
  const userHooks = {};
  (authConfig.hooks ?? []).forEach((hook) => {
    userHooks[hook.point] = hook;
  });

  if (Object.keys(userHooks).length > 0 && type.isNone(createSystemContext)) {
    throw new LowdefyInternalError(
      'Auth hooks are configured but no createSystemContext factory was provided to getBetterAuthConfig.'
    );
  }

  const databaseHooks = {};
  let afterEmailVerification;

  const points = new Set([...Object.keys(engineHooks), ...Object.keys(userHooks)]);
  points.forEach((point) => {
    const pointDef = authHookPoints[point];
    const userHook = userHooks[point];

    if (pointDef.unwired === true) {
      if (userHook) {
        logger.warn(
          `Auth hook "${userHook.id}" binds point "${point}", which has no backing callback yet - the organization plugin ships in a later phase. The hook will not fire.`
        );
      }
      return;
    }

    const hooks = [...(engineHooks[point] ?? [])];
    if (userHook) {
      const dispatch = createHookDispatch({ createSystemContext, hook: userHook });
      hooks.push(
        pointDef.timing === 'before'
          ? createUserBeforeHook({ dispatch, hook: userHook })
          : createUserAfterHook({ dispatch })
      );
    }

    if (pointDef.kind === 'database') {
      const slot =
        pointDef.timing === 'before' ? composeBeforeSlot({ hooks }) : composeAfterSlot({ hooks });
      set(databaseHooks, `${pointDef.model}.${pointDef.operation}.${pointDef.timing}`, slot);
    }
    if (point === 'email.verified') {
      afterEmailVerification = composeAfterSlot({ hooks });
    }
  });

  return { afterEmailVerification, databaseHooks };
}

export default buildHooks;
