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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Stripe',
  type: 'object',
  required: ['secretKey'],
  properties: {
    secretKey: {
      type: 'string',
      description: 'Stripe secret key.',
      errorMessage: {
        type: 'Stripe connection property "secretKey" should be a string.',
      },
    },
    apiVersion: {
      type: 'string',
      description: 'Stripe API version to use.',
      default: null,
      errorMessage: {
        type: 'Stripe connection property "apiVersion" should be a string.',
      },
    },
    telemetry: {
      type: 'boolean',
      description: 'Allow Stripe to send latency telemetry.',
      default: true,
      errorMessage: {
        type: 'Stripe connection property "telemetry" should be a boolean.',
      },
    },
    timeout: {
      type: 'integer',
      description: 'Maximum time each request can take in ms.',
      default: 80000,
      errorMessage: {
        type: 'Stripe connection property "timeout" should be an integer.',
      },
    },
    maxNetworkRetries: {
      type: 'integer',
      description: 'The amount of times a request should be retried.',
      default: 0,
      errorMessage: {
        type: 'Stripe connection property "maxNetworkRetries" should be an integer.',
      },
    },
  },
  errorMessage: {
    type: 'Stripe connection properties should be an object.',
    required: {
      secretKey: 'Stripe connection should have required property "secretKey".',
    },
  },
};
