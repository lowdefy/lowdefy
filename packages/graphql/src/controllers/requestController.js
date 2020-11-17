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

/* eslint-disable no-underscore-dangle */

import { get, serializer } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import { NodeParser } from '@lowdefy/operators';
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import { ConfigurationError, RequestError } from '../context/errors';
import resolvers from '../connections/resolvers';

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
});
ajvErrors(ajv);

function testSchema({ schema, object }) {
  const valid = ajv.validate(schema, object);
  if (!valid) {
    let message;
    if (ajv.errors.length > 1) {
      const firstMessage = ajv.errors[0].message;
      const lastMessage = ajv.errors[ajv.errors.length - 1].message;
      const firstTemplate = nunjucksFunction(firstMessage);
      const lastTemplate = nunjucksFunction(lastMessage);
      message = `${firstTemplate(ajv.errors[0])}; ${lastTemplate(
        ajv.errors[ajv.errors.length - 1]
      )}`;
    } else {
      const template = nunjucksFunction(ajv.errors[0].message);
      message = template(ajv.errors[0]);
    }
    throw new ConfigurationError(message);
  }
  return true;
}

function validateRequest({ requestData, connectionData, requestId }) {
  const connection = resolvers[connectionData.type];
  if (!connection) {
    throw new ConfigurationError(
      `Request "${requestId}" has invalid connection type "${connectionData.type}".`
    );
  }

  const request = connection.requests[requestData.type];
  if (!request) {
    throw new ConfigurationError(
      `Request "${requestId}" has invalid request type "${requestData.type}".`
    );
  }
  testSchema({ schema: connection.schema, object: connectionData.properties });
  testSchema({ schema: request.schema, object: requestData.properties });
}

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
    const requestData = await this.requestLoader.load({ pageId, contextId: blockId, requestId });
    if (!requestData) {
      throw new ConfigurationError(`Request "${requestId}" does not exist.`);
    }
    if (!requestData.connectionId) {
      throw new ConfigurationError(`Request "${requestId}" does not specify a connection.`);
    }
    const connectionData = await this.connectionLoader.load(requestData.connectionId);
    if (!connectionData) {
      throw new ConfigurationError(`Connection "${requestData.connectionId}" does not exist.`);
    }

    validateRequest({ requestData, connectionData, requestId });

    const requestType = requestData.type;
    const resolver = resolvers[connectionData.type].requests[requestData.type].resolver;

    const secrets = await this.getSecrets();

    const operatorsParser = new NodeParser({
      arrayIndices,
      input,
      lowdefyGlobal,
      secrets,
      state,
      urlQuery,
    });

    const { output: request, errors: requestParseErrors } = operatorsParser.parse({
      input: get(requestData, 'properties', { default: {} }),
      args,
      location: requestId,
    });

    if (requestParseErrors.length > 0) {
      throw new RequestError(requestParseErrors[0]);
    }

    const { output: connection, errors: connectionParseErrors } = operatorsParser.parse({
      input: get(connectionData, 'properties', { default: {} }),
      args,
      location: connectionData.connectionId,
    });

    if (connectionParseErrors.length > 0) {
      throw new RequestError(connectionParseErrors[0]);
    }

    const context = { ConfigurationError, RequestError };

    try {
      const response = await resolver({
        request,
        connection,
        context,
      });
      return {
        id: requestData.id,
        success: true,
        type: requestType,
        response: serializer.serialize(response),
      };
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
