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

import { projectCaughtError } from '@lowdefy/helpers';

import runRoutine from '../runRoutine.js';

async function controlTry(context, routineContext, { control }) {
  context.logger.debug({
    event: 'debug_control_try',
  });

  let res = await runRoutine(context, routineContext, { routine: control[':try'] });

  if (res.status === 'error' && control[':catch']) {
    context.logger.debug({
      event: 'debug_control_catch',
    });
    // A child context rather than a field set on routineContext: the same object is handed to
    // :try, :finally and every :parallel branch, so writing to it would let an inner :try clobber
    // the outer catch's error and parallel branches read each other's. steps and state are still
    // shared because routines mutate them in place. The projection is built once here, never the
    // raw error, so no operator in the catch can read its received value or source.
    const error = projectCaughtError(res.error, { scrub: context.scrubSecrets });
    res = await runRoutine(context, { ...routineContext, error }, { routine: control[':catch'] });
  }
  if (control[':finally']) {
    context.logger.debug({
      event: 'debug_control_finally',
    });
    const finallyRes = await runRoutine(context, routineContext, { routine: control[':finally'] });
    if (finallyRes.status !== 'continue') {
      res = finallyRes;
    }
  }

  return res;
}

export default controlTry;
