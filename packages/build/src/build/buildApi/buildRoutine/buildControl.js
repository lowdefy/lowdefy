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

import buildRoutine from './buildRoutine.js';
import countControl from './countControl.js';
import { validateControl, routineKey } from './controlTypes.js';
import countOperators from '../../../utils/countOperators.js';

function buildControl(control, endpointContext) {
  const controlType = validateControl(control, endpointContext);
  Object.keys(control).forEach((key) => {
    if (routineKey(controlType, key)) {
      countControl(key, endpointContext);
      buildRoutine(control[key], endpointContext);
    } else {
      countOperators(control[key], { counter: endpointContext.typeCounters.operators.server });
      countControl(key, endpointContext);
    }
  });
}

export default buildControl;
