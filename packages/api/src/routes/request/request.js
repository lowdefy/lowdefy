/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { serializer } from '@lowdefy/helpers';

import authorizeRequest from './authorizeRequest';
// import evaluateOperators from './evaluateOperators';
// import getConnectionPackage from './getConnectionPackage';
// import getRequestDefinition from './getRequestDefinition';
import loadConnection from './loadConnection';
import loadRequest from './loadRequest';

async function request(context, { pageId, payload, requestId }) {
  const request = await loadRequest(context, { pageId, requestId });

  authorizeRequest(context, { request });

  const connection = await loadConnection(context, { request });

  // Get definitions early to throw and avoid evaluating operators if request/connection type is invalid
  // const connectionPackage = await getConnectionPackage(context, { connection, request });
  // const requestDefinition = getRequestDefinition(context, { connectionDefinition, request });

  // const { connectionProperties, requestProperties } = await evaluateOperators(context, {
  //   connection,
  //   payload: serializer.deserialize(payload),
  //   request,
  // });

  // this.checkConnectionRead({
  //   connectionId: request.connectionId,
  //   connectionProperties,
  //   checkRead: requestDefinition.checkRead,
  // });
  // this.checkConnectionWrite({
  //   connectionId: request.connectionId,
  //   connectionProperties,
  //   checkWrite: requestDefinition.checkWrite,
  // });

  // try {
  //   validate({ schema: connectionDefinition.schema, data: connectionProperties });
  //   validate({ schema: requestDefinition.schema, data: requestProperties });
  // } catch (error) {
  //   throw new ConfigurationError(error.message);
  // }

  // const response = await this.callResolver({
  //   connectionProperties,
  //   requestProperties,
  //   resolver: requestDefinition.resolver,
  // });

  const response = null;

  return {
    id: request.id,
    success: true,
    type: request.type,
    response: serializer.serialize(response),
  };
}

export default request;
