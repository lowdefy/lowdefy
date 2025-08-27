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

import { type } from '@lowdefy/helpers';
import buildStep from './buildStep.js';
import buildControl from './buildControl.js';

function buildRoutine(routine, endpointContext) {
  if (type.isArray(routine)) {
    routine.forEach((item) => {
      buildRoutine(item, endpointContext);
    });
    return;
  }
  if (type.isObject(routine)) {
    if (Object.keys(routine)[0]?.startsWith(':')) {
      buildControl(routine, endpointContext);
    } else {
      buildStep(routine, endpointContext);
    }
    return;
  }
  throw new Error(
    `Routine at ${endpointContext.endpointId} on endpoint ${
      endpointContext.endpointId
    } is not an array or object. Received "${
      type.isString(routine) ? routine : JSON.stringify(routine)
    }"`
  );
}

export default buildRoutine;
