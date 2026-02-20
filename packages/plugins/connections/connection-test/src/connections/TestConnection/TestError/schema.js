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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - TestError',
  type: 'object',
  required: ['errorType'],
  properties: {
    errorType: {
      type: 'string',
      enum: ['Error', 'ConfigError', 'ServiceError', 'UserError', 'TypeError', 'RangeError'],
      description: 'The type of error to throw.',
      errorMessage: {
        type: 'TestError property "errorType" should be a string.',
        enum: 'TestError property "errorType" must be one of "Error", "ConfigError", "ServiceError", "UserError", "TypeError", "RangeError".',
      },
    },
    message: {
      type: 'string',
      description: 'The error message.',
      default: 'Test error',
    },
  },
};
