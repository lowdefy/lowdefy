/* eslint-disable no-underscore-dangle */
import { get, serializer } from '@lowdefy/helpers';
import { NodeParser } from '@lowdefy/operators';
import { ConfigurationError, RequestError } from '../context/errors';
import resolvers from '../connections/resolvers';

function validateRequest(requestData, requestId) {
  if (!requestData) {
    throw new ConfigurationError(`Request "${requestId}" does not exist.`);
  }
  if (!requestData.connectionId) {
    throw new ConfigurationError(`Request "${requestId}" does not specify a connection.`);
  }
  if (!Object.keys(resolvers).includes(requestData.type)) {
    throw new ConfigurationError(
      `Request "${requestId}" has invalid request type "${requestData.type}".`
    );
  }
}

function validateConnection(connectionData, requestData) {
  if (!connectionData) {
    throw new ConfigurationError(`Connection "${requestData.connectionId}" does not exist.`);
  }
  if (resolvers[requestData.type].connectionType !== connectionData.type) {
    throw new ConfigurationError(
      `Connection "${requestData.connectionId}" is not of type required by request "${requestData.requestId}".`
    );
  }
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

    validateRequest(requestData, requestId);

    const connectionData = await this.connectionLoader.load(requestData.connectionId);

    validateConnection(connectionData, requestData);

    const requestType = get(requestData, 'type');

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
      const response = await resolvers[requestType].resolver({
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

export { RequestController };

export default createRequestController;
