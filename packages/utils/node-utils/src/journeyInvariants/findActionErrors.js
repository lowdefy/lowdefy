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

import { expectedErrorNames } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The action-error findings of a step's trace emits (the engine's value-free summary of each
// completed event): one per event that failed with an error that is not an expected outcome. A
// failed Validate (a UserError) or an auth gate's 401 or 403 refusal is the app doing its job.
// resolveSource(configKey) gives the failed action's config location. Returns finding drafts
// { kind, message, source, configKey } for keyFindings.
async function findActionErrors({ emits, resolveSource }) {
  const drafts = [];
  for (const emit of emits) {
    if (emit.success !== false || expectedErrorNames.has(emit.failure?.errorName)) continue;
    const { actionId, actionType, configKey, errorName } = emit.failure ?? {};
    drafts.push({
      kind: 'action-error',
      message: `${actionType ?? 'An action'} "${actionId ?? 'unknown'}" failed in ${emit.blockId}.${
        emit.eventName
      } with ${errorName ?? 'an error'}.`,
      configKey: configKey ?? null,
      source: type.isNone(configKey) ? null : await resolveSource(configKey),
    });
  }
  return drafts;
}

export default findActionErrors;
