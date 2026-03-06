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

import runRoutine from '../runRoutine.js';

async function controlTry(context, routineContext, { control }) {
  context.logger.debug({
    event: 'debug_control_try',
  });

  let res = await runRoutine(context, routineContext, { routine: control[':try'] });

  if (res.status === 'error') {
    if (control[':catch']) {
      context.logger.debug({
        event: 'debug_control_catch',
      });
      res = await runRoutine(context, routineContext, { routine: control[':catch'] });
    }
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
