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

import { ServerParser } from '@lowdefy/operators';

import { RequestError } from '../../context/errors.js';

function evaluateOperators(
  { jsMap, operators, secrets, session },
  { connectionConfig, payload, requestConfig }
) {
  const operatorsParser = new ServerParser({
    jsMap,
    operators,
    payload,
    secrets,
    user: session?.user,
  });
  const { output: connectionProperties, errors: connectionErrors } = operatorsParser.parse({
    input: connectionConfig.properties || {},
    location: connectionConfig.connectionId,
  });
  if (connectionErrors.length > 0) {
    throw new RequestError(connectionErrors[0]);
  }

  const { output: requestProperties, errors: requestErrors } = operatorsParser.parse({
    input: requestConfig.properties || {},
    location: requestConfig.requestId,
  });
  if (requestErrors.length > 0) {
    throw new RequestError(requestErrors[0]);
  }

  return {
    connectionProperties,
    requestProperties,
  };
}

export default evaluateOperators;
