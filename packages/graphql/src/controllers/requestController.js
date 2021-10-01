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

import { validate } from '@lowdefy/ajv';
import { serializer } from '@lowdefy/helpers';
import { NodeParser } from '@lowdefy/operators';
import { ConfigurationError, RequestError } from '../context/errors';
import resolvers from '../connections/resolvers';

class RequestController {
  constructor({ getController, getLoader, getSecrets, user }) {
    this.authorizationController = getController('authorization');
    this.connectionLoader = getLoader('connection');
    this.getSecrets = getSecrets;
    this.requestLoader = getLoader('request');
    this.user = user;
  }

  async callRequest(requestInput) {
    // get variables needed to load request/connection from requestInput
    const { blockId, pageId, requestId } = requestInput;

    const request = await this.loadRequest({
      pageId,
      contextId: blockId,
      requestId,
    });

    // authorizeRequest will throw if not authorized
    this.authorizeRequest({ request });
    const connection = await this.loadConnection({ connectionId: request.connectionId });

    // Get definitions early to throw and avoid parsing if request/connection type is invalid
    const connectionDefinition = this.getConnectionDefinition({ connection, request });
    const requestDefinition = this.getRequestDefinition({ connectionDefinition, request });

    // Deserialize payload
    const payload = serializer.deserialize(requestInput.payload);

    const { connectionProperties, requestProperties } = await this.parseOperators({
      connection,
      payload,
      request,
    });

    this.checkConnectionRead({
      connectionId: request.connectionId,
      connectionProperties,
      checkRead: requestDefinition.checkRead,
    });
    this.checkConnectionWrite({
      connectionId: request.connectionId,
      connectionProperties,
      checkWrite: requestDefinition.checkWrite,
    });

    try {
      validate({ schema: connectionDefinition.schema, data: connectionProperties });
      validate({ schema: requestDefinition.schema, data: requestProperties });
    } catch (error) {
      throw new ConfigurationError(error.message);
    }

    const response = await this.callResolver({
      connectionProperties,
      requestProperties,
      resolver: requestDefinition.resolver,
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

  authorizeRequest({ request }) {
    if (!this.authorizationController.authorize(request)) {
      throw new ConfigurationError(`Request "${request.requestId}" does not exist.`);
    }
  }

  async loadConnection({ connectionId }) {
    const connection = await this.connectionLoader.load(connectionId);
    if (!connection) {
      throw new ConfigurationError(`Connection "${connectionId}" does not exist.`);
    }
    return connection;
  }

  getConnectionDefinition({ connection, request }) {
    const connectionDefinition = resolvers[connection.type];
    if (!connectionDefinition) {
      throw new ConfigurationError(
        `Request "${request.requestId}" has invalid connection type "${connection.type}".`
      );
    }
    return connectionDefinition;
  }

  getRequestDefinition({ connectionDefinition, request }) {
    const requestDefinition = connectionDefinition.requests[request.type];
    if (!requestDefinition) {
      throw new ConfigurationError(
        `Request "${request.requestId}" has invalid request type "${request.type}".`
      );
    }
    return requestDefinition;
  }

  async parseOperators({ connection, payload, request }) {
    const secrets = await this.getSecrets();
    const operatorsParser = new NodeParser({
      payload,
      secrets,
      user: this.user,
    });
    await operatorsParser.init();
    const { output: connectionProperties, errors: connectionErrors } = operatorsParser.parse({
      input: connection.properties || {},
      location: connection.connectionId,
    });
    if (connectionErrors.length > 0) {
      throw new RequestError(connectionErrors[0]);
    }

    const { output: requestProperties, errors: requestErrors } = operatorsParser.parse({
      input: request.properties || {},
      location: request.requestId,
    });
    if (requestErrors.length > 0) {
      throw new RequestError(requestErrors[0]);
    }

    return {
      connectionProperties,
      requestProperties,
    };
  }

  checkConnectionRead({ connectionId, connectionProperties, checkRead }) {
    if (checkRead && connectionProperties.read === false) {
      throw new ConfigurationError(`Connection "${connectionId}" does not allow reads.`);
    }
  }

  checkConnectionWrite({ connectionId, connectionProperties, checkWrite }) {
    if (checkWrite && connectionProperties.write !== true) {
      throw new ConfigurationError(`Connection "${connectionId}" does not allow writes.`);
    }
  }

  async callResolver({ connectionProperties, requestProperties, resolver }) {
    try {
      const response = await resolver({
        request: requestProperties,
        connection: connectionProperties,
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

export { RequestController };

export default createRequestController;
