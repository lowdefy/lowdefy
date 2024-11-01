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

import { get, serializer } from '@lowdefy/helpers';

// function createCallAPI(context) {
//   return async function callAPI({ params, blockId, event }) {
//     console.log('CallAPICLASS', params, blockId, event);

//     if (!context.apiResponses[params.endpoint]) {
//       context.apiResponses[params.endpoint] = [];
//     }

//     const api = {
//       ...params,
//       blockId,
//     };

//     context.apiResponses[api.endpoint].unshift(api);

//     console.log('FETCH', api);
//     api.loading = true;
//     api.success = null;
//     const startTime = Date.now();

//     const { response, success } = await context._internal.lowdefy._internal.callAPI({
//       blockId: api.blockId,
//       pageId: context.pageId,
//       payload: serializer.serialize(api.payload),
//       endpointId: api.endpoint,
//     });
//     console.log('RESPONSE', response);

//     const deserializedResponse = serializer.deserialize(
//       get(response, 'response', {
//         default: null,
//       })
//     );

//     api.response = deserializedResponse;
//     api.success = success;
//     api.loading = false;
//     const endTime = Date.now();
//     api.responseTime = endTime - startTime;
//     context._internal.update();

//     return deserializedResponse;
//   }
// }
class API {
  constructor(context) {
    this.context = context;
    this.callAPI = this.callAPI.bind(this);
    this.fetch = this.fetch.bind(this);

    this.apiConfig = {};

    // (this.context._internal.rootBlock.api || []).forEach((endpoint) => {
    //   this.apiConfig[endpoint.endpointId] = endpoint;
    // });
  }

  async callAPI({ params, blockId, event }) {
    console.log('CallAPICLASS', params, blockId, event);

    if (!this.context.apiResponses[params.endpoint]) {
      this.context.apiResponses[params.endpoint] = [];
    }

    const api = {
      ...params,
      blockId,
    };

    this.context.apiResponses[api.endpoint].unshift(api);

    await this.fetch(api);
  }

  async fetch(api) {
    console.log('FETCH', api);
    api.loading = true;
    api.success = null;
    const startTime = Date.now();

    const { response, success } = await this.context._internal.lowdefy._internal.callAPI({
      blockId: api.blockId,
      pageId: this.context.pageId,
      payload: serializer.serialize(api.payload),
      endpointId: api.endpoint,
    });
    console.log('RESPONSE', response);

    // const deserializedResponse = serializer.deserialize(
    //   get(response, 'response', {
    //     default: null,
    //   })
    // );

    api.response = response;
    api.success = success;
    api.loading = false;
    const endTime = Date.now();
    api.responseTime = endTime - startTime;
    this.context._internal.update();

    return response;
  }
}

export default API;
