/*
  Copyright 2020-2026 Lowdefy, Inc

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

import axios from 'axios';
import { type } from '@lowdefy/helpers';

import createAxiosConfig from './createAxiosConfig.js';
import { REFUSED_CODE } from './createRefusedError.js';
import schema from '../requestSchema.js';

async function AxiosHttp({ request, connection }) {
  const config = createAxiosConfig({ connection, request });
  try {
    const res = await axios(config);
    const { status, statusText, headers, method, path, data } = res;
    return { status, statusText, headers, method, path, data };
  } catch (error) {
    // A refused address or host is raised inside axios, which wraps it (and follow-redirects wraps
    // it again on a redirect), so the refusal is thrown as it was written.
    let cause = error;
    while (!type.isNone(cause)) {
      if (cause.code === REFUSED_CODE) {
        throw cause;
      }
      cause = cause.cause;
    }
    if (error.response) {
      const responseError = new Error(
        `Http response "${error.response.status}: ${error.response.statusText}".`,
        { cause: error }
      );
      // The wrapper is what the request layer sees, and codes are read from
      // each error's own fields, so the upstream code and status have to live
      // here too.
      responseError.code = error.code;
      responseError.statusCode = error.response.status;
      throw responseError;
    }
    throw error;
  }
}

AxiosHttp.schema = schema;
AxiosHttp.meta = {
  checkRead: false,
  checkWrite: false,
};

export default AxiosHttp;
