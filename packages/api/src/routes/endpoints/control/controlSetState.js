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

import { set } from '@lowdefy/helpers';

function controlSetState(context, routineContext, { control }) {
  const { logger, evaluateOperators } = context;
  const { items } = routineContext;

  const evaluatedSetState = evaluateOperators({
    input: control[':set_state'],
    items,
    location: control['~k'] ?? ':set_state',
    steps: routineContext.steps,
    payload: routineContext.payload,
  });

  logger.debug({
    event: 'debug_control_set_state',
    input: control[':set_state'],
    evaluated: evaluatedSetState,
  });

  Object.entries(evaluatedSetState).forEach(([key, value]) => {
    set(context.state, key, value);
  });

  return { status: 'continue' };
}

export default controlSetState;
