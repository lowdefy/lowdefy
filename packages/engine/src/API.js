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

import { serializer } from '@lowdefy/helpers';

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
    // const apiConfig = this.apiConfig[endPointId];
    // if (!this.context.api[endPointId]) {
    //   this.context.api[endPointId] = [];
    // }
    // if (!apiConfig) {
    //   const error = new Error(`Configuration Error: API ${endPointId} not defined on page.`);
    //   this.context.api[endPointId].unshift({
    //     error,
    //     loading: false,
    //     response: null,
    //   });
    //   throw error;
    // }

    const api = {
      ...params,
      blockId,
    };

    await this.fetch(api);
  }
  async fetch(api) {
    console.log('FETCH', api);
    const response = await this.context._internal.lowdefy._internal.callAPI({
      blockId: api.blockId,
      pageId: this.context.pageId,
      payload: serializer.serialize(api.payload),
      endpointId: api.endpoint,
    });
    console.log('RESPONSE', response);
  }
}

export default API;
