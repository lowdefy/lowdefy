/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function controlParallel(context, routineContext, { control }) {
  const { logger } = context;
  logger.debug({
    event: 'debug_control_parallel',
  });

  const results = await Promise.all(
    control[':parallel'].map((subRoutine) => {
      logger.debug({
        event: 'debug_control_parallel_start',
        start: Date.now(),
      });
      return runRoutine(context, routineContext, { routine: subRoutine });
    })
  );

  const resultsMap = { error: [], reject: [], return: [], continue: [] };
  results.forEach((res) => (resultsMap[res.status] = [...resultsMap[res.status], res]));

  return (
    resultsMap.error?.[0] ??
    resultsMap.reject?.[0] ??
    resultsMap.return?.[0] ?? { status: 'continue' }
  );
}

export default controlParallel;
