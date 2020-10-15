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

import get from '@lowdefy/get';
import serializer from '@lowdefy/serializer';
import gql from 'graphql-tag';

const CALL_MUTATION = gql`
  mutation callMutation($requestMutationInput: RequestMutationInput!) {
    requestMutation(requestMutationInput: $requestMutationInput) {
      id
      type
      success
      response
    }
  }
`;

class Mutations {
  constructor(context) {
    this.context = context;
    this.mutationList = this.context.rootBlock.mutations || [];

    this.callMutation = this.callMutation.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  callMutation({ mutationId, args, arrayIndices }) {
    if (!this.context.mutations[mutationId]) {
      const mutation = this.mutationList.find((mut) => mut.mutationId === mutationId);
      if (!mutation) {
        this.context.mutations[mutationId] = {
          loading: false,
          response: null,
          error: [new Error(`Configuration Error: Mutation ${mutationId} not defined on context.`)],
        };
        return Promise.reject(
          new Error(`Configuration Error: Mutation ${mutationId} not defined on context.`)
        );
      }
      this.context.mutations[mutationId] = {
        loading: true,
        response: null,
        error: [],
      };
    }

    return this.fetch(mutationId, args, arrayIndices);
  }

  fetch(mutationId, args, arrayIndices) {
    this.context.mutations[mutationId].loading = true;
    return this.context.client
      .mutate({
        mutation: CALL_MUTATION,
        variables: {
          requestMutationInput: {
            arrayIndices,
            mutationId,
            args: serializer.serialize(args) || {},
            blockId: this.context.blockId,
            input: serializer.serialize(this.context.input),
            lowdefyGlobal: serializer.serialize(this.context.lowdefyGlobal),
            pageId: this.context.pageId,
            state: serializer.serialize(this.context.state),
            urlQuery: serializer.serialize(this.context.urlQuery),
          },
        },
      })
      .then((result) => {
        this.context.mutations[mutationId].response = serializer.deserialize(
          get(result, 'data.requestMutation.response', {
            default: null,
          })
        );
        this.context.mutations[mutationId].error.unshift(null);
        return this.context.mutations[mutationId].response;
      })
      .catch((error) => {
        this.context.mutations[mutationId].error.unshift(error);
        throw error;
      })
      .finally(() => {
        this.context.mutations[mutationId].loading = false;
        this.context.update();
      });
  }
}

export default Mutations;
