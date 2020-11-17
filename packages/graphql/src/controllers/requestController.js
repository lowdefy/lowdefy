/*
  Copyright 2020 Lowdefy, Inc

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
import { NodeParser } from '@lowdefy/operators';
import { ConfigurationError, RequestError } from '../context/errors';
import resolvers from '../connections/resolvers';
import testSchema from '../utils/testSchema';

class RequestController {
  constructor({ getLoader, getSecrets }) {
    this.getSecrets = getSecrets;
    this.requestLoader = getLoader('request');
    this.connectionLoader = getLoader('connection');
  }

  async callRequest({
    args,
    arrayIndices,
    blockId,
    input,
    lowdefyGlobal,
    pageId,
    requestId,
    state,
    urlQuery,
  }) {
    const request = await this.loadRequest({
      pageId,
      contextId: blockId,
      requestId,
    });
    const connection = await this.loadConnection({ connectionId: request.connectionId });

    // Get resolver early to throw and avoid parsing if request/connection type is invalid
    const { connectionSchema, requestSchema, resolver } = this.getResolverAndSchemas({
      connection,
      request,
    });

    const { connectionProperties, requestProperties } = await this.parseOperators({
      args,
      arrayIndices,
      connection,
      input,
      lowdefyGlobal,
      request,
      state,
      urlQuery,
    });

    testSchema({ schema: connectionSchema, object: connectionProperties });
    testSchema({ schema: requestSchema, object: requestProperties });

    const response = await this.callResolver({
      connectionProperties,
      requestProperties,
      resolver,
    });

    return {
      id: request.id,
      success: true,
      type: request.type,
      response: serializer.serialize(response),
    };
  }

  async loadRequest({ pageId, contextId, requestId }) {
    const request = await this.requestLoader.load({ pageId, contextId, requestId });
    if (!request) {
      throw new ConfigurationError(`Request "${requestId}" does not exist.`);
    }
    if (!request.connectionId) {
      throw new ConfigurationError(`Request "${requestId}" does not specify a connection.`);
    }

    return request;
  }

  async loadConnection({ connectionId }) {
    const connection = await this.connectionLoader.load(connectionId);
    if (!connection) {
      throw new ConfigurationError(`Connection "${connectionId}" does not exist.`);
    }
    return connection;
  }

  getResolverAndSchemas({ connection, request }) {
    // Name ??
    const connectionObj = resolvers[connection.type];
    if (!connectionObj) {
      throw new ConfigurationError(
        `Request "${request.requestId}" has invalid connection type "${connection.type}".`
      );
    }
    // Name ??
    const requestObj = connectionObj.requests[request.type];
    if (!requestObj) {
      throw new ConfigurationError(
        `Request "${request.requestId}" has invalid request type "${request.type}".`
      );
    }
    return {
      connectionSchema: connectionObj.schema,
      requestSchema: requestObj.schema,
      resolver: requestObj.resolver,
    };
  }

  async parseOperators({
    args,
    arrayIndices,
    connection,
    input,
    lowdefyGlobal,
    request,
    state,
    urlQuery,
  }) {
    const secrets = await this.getSecrets();
    const operatorsParser = new NodeParser({
      arrayIndices,
      input,
      lowdefyGlobal,
      secrets,
      state,
      urlQuery,
    });

    const { output: connectionProperties, errors: connectionErrors } = operatorsParser.parse({
      input: connection.properties || {},
      location: connection.connectionId,
      args,
    });
    if (connectionErrors.length > 0) {
      throw new RequestError(connectionErrors[0]);
    }

    const { output: requestProperties, errors: requestErrors } = operatorsParser.parse({
      input: request.properties || {},
      location: request.requestId,
      args,
    });
    if (requestErrors.length > 0) {
      throw new RequestError(requestErrors[0]);
    }

    return {
      connectionProperties,
      requestProperties,
    };
  }

  async callResolver({ connectionProperties, requestProperties, resolver }) {
    const context = { ConfigurationError, RequestError };
    try {
      const response = await resolver({
        request: requestProperties,
        connection: connectionProperties,
        context,
      });
      return response;
    } catch (err) {
      if (err instanceof ConfigurationError || err instanceof RequestError) {
        throw err;
      }
      throw new RequestError(err.message);
    }
  }
}

function createRequestController(context) {
  return new RequestController(context);
}

export { RequestController, testSchema };

export default createRequestController;
