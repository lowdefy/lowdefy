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

import { get, serializer, type } from '@lowdefy/helpers';

class Requests {
  constructor(context) {
    this.context = context;
    this.callRequests = this.callRequests.bind(this);
    this.callRequest = this.callRequest.bind(this);
    this.fetch = this.fetch.bind(this);

    this.requestConfig = {};

    (this.context._internal.rootBlock.requests || []).forEach((request) => {
      this.requestConfig[request.requestId] = request;
    });
  }

  callRequests({ actions, arrayIndices, event, params } = {}) {
    if (params.all === true) {
      return Promise.all(
        Object.keys(this.requestConfig).map((requestId) =>
          this.callRequest({ requestId, event, arrayIndices })
        )
      );
    }

    let requestIds = [];
    if (type.isString(params)) requestIds = [params];
    if (type.isArray(params)) requestIds = params;

    return Promise.all(
      requestIds.map((requestId) => this.callRequest({ actions, requestId, event, arrayIndices }))
    );
  }

  callRequest({ actions, arrayIndices, event, requestId }) {
    const request = this.requestConfig[requestId];
    if (!request) {
      const error = new Error(`Configuration Error: Request ${requestId} not defined on page.`);
      this.context.requests[requestId] = {
        loading: false,
        response: null,
        error: [error],
      };
      return Promise.reject(error);
    }

    if (!this.context.requests[requestId]) {
      this.context.requests[requestId] = {
        loading: true,
        response: null,
        error: [],
      };
    }

    const { output: payload, errors: parserErrors } = this.context._internal.parser.parse({
      actions,
      event,
      arrayIndices,
      input: request.payload,
      location: requestId,
    });

    // TODO: We are throwing this error differently to the request does not exist error
    if (parserErrors.length > 0) {
      throw parserErrors[0];
    }

    return this.fetch({ requestId, payload });
  }

  async fetch({ requestId, payload }) {
    this.context.requests[requestId].loading = true;
    if (this.context._internal.RootBlocks) {
      this.context._internal.RootBlocks.setBlocksLoadingCache();
    }

    try {
      const response = await this.context._internal.lowdefy._internal.callRequest({
        pageId: this.context.pageId,
        payload: serializer.serialize(payload),
        requestId,
      });
      const deserializedResponse = serializer.deserialize(
        get(response, 'response', {
          default: null,
        })
      );
      this.context.requests[requestId].response = deserializedResponse;
      this.context.requests[requestId].loading = false;
      this.context._internal.update();
      return deserializedResponse;
    } catch (error) {
      this.context.requests[requestId].error.unshift(error);
      this.context.requests[requestId].loading = false;
      this.context._internal.update();
      throw error;
    }
  }
}

export default Requests;
