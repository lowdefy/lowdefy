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

  callRequests({ actions, arrayIndices, blockId, event, params } = {}) {
    if (type.isObject(params) && params.all === true) {
      return Promise.all(
        Object.keys(this.requestConfig).map((requestId) =>
          this.callRequest({ arrayIndices, blockId, event, requestId })
        )
      );
    }

    let requestIds = [];
    if (type.isString(params)) requestIds = [params];
    if (type.isArray(params)) requestIds = params;

    const requests = requestIds.map((requestId) =>
      this.callRequest({ actions, requestId, blockId, event, arrayIndices })
    );
    this.context._internal.update(); // update to render request reset
    return Promise.all(requests);
  }

  async callRequest({ actions, arrayIndices, blockId, event, requestId }) {
    const requestConfig = this.requestConfig[requestId];
    if (!this.context.requests[requestId]) {
      this.context.requests[requestId] = [];
    }
    if (!requestConfig) {
      const error = new Error(`Configuration Error: Request ${requestId} not defined on page.`);
      this.context.requests[requestId].unshift({
        blockId: 'block_id',
        error,
        loading: false,
        requestId,
        response: null,
      });
      throw error;
    }
    const { output: payload, errors: parserErrors } = this.context._internal.parser.parse({
      actions,
      event,
      arrayIndices,
      input: requestConfig.payload,
      location: requestId,
    });
    if (parserErrors.length > 0) {
      throw parserErrors[0];
    }
    const request = {
      blockId,
      loading: true,
      payload,
      requestId,
      response: null,
    };
    this.context.requests[requestId].unshift(request);
    return this.fetch(request);
  }

  async fetch(request) {
    request.loading = true;
    const startTime = Date.now();

    try {
      const response = await this.context._internal.lowdefy._internal.callRequest({
        blockId: request.blockId,
        pageId: this.context.pageId,
        payload: serializer.serialize(request.payload),
        requestId: request.requestId,
      });
      const deserializedResponse = serializer.deserialize(
        get(response, 'response', {
          default: null,
        })
      );
      request.response = deserializedResponse;
      request.loading = false;
      const endTime = Date.now();
      request.responseTime = endTime - startTime;
      this.context._internal.update();
      return deserializedResponse;
    } catch (error) {
      request.error = error;
      request.loading = false;
      const endTime = Date.now();
      request.responseTime = endTime - startTime;
      this.context._internal.update();
      throw error;
    }
  }
}

export default Requests;
