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

import evaluateRoutineOperators from '../endpoints/evaluateRoutineOperators.js';

// Connection and request properties evaluate against the same frame, so `_item` in a connection's
// properties resolves inside a `:for` loop just like it does in the request's.
function evaluateOperators(context, { connectionConfig, requestConfig, routineContext }) {
  const connectionProperties = evaluateRoutineOperators(context, routineContext, {
    input: connectionConfig.properties || {},
    location: connectionConfig.connectionId,
  });

  const requestProperties = evaluateRoutineOperators(context, routineContext, {
    input: requestConfig.properties || {},
    location: requestConfig.stepId ?? requestConfig.requestId,
  });

  return {
    connectionProperties,
    requestProperties,
  };
}

export default evaluateOperators;
