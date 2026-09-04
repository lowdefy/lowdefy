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

// Evaluates a `runAs: { organizationId }` declaration (an endpoint's or a
// step's) against the routine context it applies to, so an endpoint-level
// value sees the payload-free fresh context and a step-level value sees the
// results of the steps before it (`_step`). The build already refused the
// `_payload` source (validateRunAs), and an endpoint-level runAs is evaluated
// with an empty payload as well as an empty state, so the runtime enforces
// what the build asserts: an operator that reaches the payload without a
// literal `_payload` key (a plugin operator, a `_js` module closing over it)
// still finds nothing there.
//
// Only the wall's scope moves. `context.user` is untouched: authorization,
// `_user` and logging keep describing the real caller, so runAs can never
// grant access the caller was refused. The evaluated value is validated where
// it is consumed (resolveTenant), which is the one place that knows whether
// the connection is walled at all. The declaration's configKey travels with
// the value so a bad evaluation points at the runAs line, not the step.
function resolveRunAs(context, routineContext, { runAs, location, configKey, source }) {
  if (type.isNone(runAs)) {
    return undefined;
  }
  const endpointLevel = source === 'endpoint';
  const organizationId = context.evaluateOperators({
    input: runAs.organizationId,
    items: routineContext.items,
    location,
    payload: endpointLevel ? {} : routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });
  return { organizationId, configKey, source };
}

export default resolveRunAs;
