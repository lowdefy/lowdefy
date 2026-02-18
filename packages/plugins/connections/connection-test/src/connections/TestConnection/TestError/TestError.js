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

import { ConfigError, ServiceError, UserError } from '@lowdefy/errors';

import schema from './schema.js';

async function TestError({ request }) {
  const message = request.message ?? 'Test error';
  const errorType = request.errorType ?? 'Error';

  switch (errorType) {
    case 'ConfigError':
      throw new ConfigError(message);
    case 'ServiceError':
      throw new ServiceError(message, { service: 'TestService' });
    case 'UserError':
      throw new UserError(message);
    case 'TypeError':
      throw new TypeError(message);
    case 'RangeError':
      throw new RangeError(message);
    default:
      throw new Error(message);
  }
}

TestError.schema = schema;
TestError.meta = {
  checkRead: false,
  checkWrite: false,
};

export default TestError;
