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

import gql from 'graphql-tag';
import { get, serializer } from '@lowdefy/helpers';

const CALL_REQUEST = gql`
  query callRequest($input: RequestInput!) {
    request(input: $input) {
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

  callRequests({ requestIds, event, arrayIndices } = {}) {
    if (!requestIds) {
      return Promise.all(
        this.requestList.map((request) =>
          this.callRequest({ requestId: request.requestId, event, arrayIndices })
        )
      );
    }
    return Promise.all(
      requestIds.map((requestId) => this.callRequest({ requestId, event, arrayIndices }))
    );
  }

  callRequest({ requestId, event, arrayIndices }) {
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

    return this.fetch({ requestId, event, arrayIndices });
  }

  async fetch({ requestId, event, arrayIndices }) {
    this.context.requests[requestId].loading = true;
    if (this.context.RootBlocks) {
      this.context.RootBlocks.setBlocksLoadingCache();
    }

    try {
      const gqlResponse = await this.context.lowdefy.client.query({
        query: CALL_REQUEST,
        fetchPolicy: 'network-only',
        variables: {
          input: {
            arrayIndices,
            requestId,
            blockId: this.context.blockId,
            event: serializer.serialize(event) || {},
            input: serializer.serialize(this.context.lowdefy.inputs[this.context.id]),
            lowdefyGlobal: serializer.serialize(this.context.lowdefy.lowdefyGlobal),
            pageId: this.context.pageId,
            state: serializer.serialize(this.context.state),
            urlQuery: serializer.serialize(this.context.lowdefy.urlQuery),
          },
        },
      });
      const response = serializer.deserialize(
        get(gqlResponse, 'data.request.response', {
          default: null,
        })
      );
      this.context.requests[requestId].response = response;
      this.context.requests[requestId].loading = false;
      this.context.update();
      return response;
    } catch (error) {
      this.context.requests[requestId].error.unshift(error);
      this.context.requests[requestId].loading = false;
      this.context.update();
      throw error;
    }
  }
}

export default Requests;
