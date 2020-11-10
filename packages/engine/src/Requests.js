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

import gql from 'graphql-tag';
import { get, serializer } from '@lowdefy/helpers';

const CALL_REQUEST = gql`
  query callRequest($requestInput: RequestInput!) {
    request(requestInput: $requestInput) {
      id
      type
      success
      response
    }
  }
`;

class Requests {
  constructor(context) {
    this.context = context;
    this.requestList = this.context.rootBlock.requests || [];

    this.callRequests = this.callRequests.bind(this);
    this.callRequest = this.callRequest.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  callRequests({ requestIds, args, arrayIndices } = {}) {
    if (!requestIds) {
      return Promise.all(
        this.requestList.map((request) =>
          this.callRequest({ requestId: request.requestId, args, arrayIndices })
        )
      );
    }
    return Promise.all(
      requestIds.map((requestId) => this.callRequest({ requestId, args, arrayIndices }))
    );
  }

  callRequest({ requestId, args, arrayIndices }) {
    if (!this.context.requests[requestId]) {
      const request = this.requestList.find((req) => req.requestId === requestId);
      if (!request) {
        this.context.requests[requestId] = {
          loading: false,
          response: null,
          error: [new Error(`Configuration Error: Request ${requestId} not defined on context.`)],
        };
        return Promise.reject(
          new Error(`Configuration Error: Request ${requestId} not defined on context.`)
        );
      }
      this.context.requests[requestId] = {
        loading: true,
        response: null,
        error: [],
      };
    }

    return this.fetch({ requestId, args, arrayIndices });
  }

  fetch({ requestId, args, arrayIndices }) {
    this.context.requests[requestId].loading = true;
    if (this.context.RootBlocks) {
      this.context.RootBlocks.setBlocksLoadingCache();
    }

    return this.context.client
      .query({
        query: CALL_REQUEST,
        fetchPolicy: 'network-only',
        variables: {
          requestInput: {
            arrayIndices,
            requestId,
            blockId: this.context.blockId,
            args: serializer.serialize(args) || {},
            input: serializer.serialize(this.context.input),
            lowdefyGlobal: serializer.serialize(this.context.lowdefyGlobal),
            pageId: this.context.pageId,
            state: serializer.serialize(this.context.state),
            urlQuery: serializer.serialize(this.context.urlQuery),
          },
        },
      })
      .then((result) => {
        this.context.requests[requestId].response = serializer.deserialize(
          get(result, 'data.request.response', {
            default: null,
          })
        );
        this.context.requests[requestId].error.unshift(null);
        return result;
      })
      .catch((error) => {
        this.context.requests[requestId].error.unshift(error);
        throw error;
      })
      .finally(() => {
        this.context.requests[requestId].loading = false;
        this.context.update();
      });
  }
}

export default Requests;
