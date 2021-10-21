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

import request from '../utils/request';

function createLogin({ window }) {
  async function login({ authUrlQueryParams, pageId, urlQuery } = {}) {
    const data = await request({
      url: '/lowdefy/auth/openIdAuthorizationUrl',
      method: 'POST',
      body: {
        authUrlQueryParams,
        pageId,
        urlQuery,
      },
    });
    if (!data.openIdAuthorizationUrl) {
      throw new Error('Authorization URL not found.');
    }
    window.location.href = data.openIdAuthorizationUrl;
  }

  return login;
}

export default createLogin;