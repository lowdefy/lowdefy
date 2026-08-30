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
// Must match the bodies of POST /lowdefy-docs/run-request and /run-endpoint in
// @lowdefy/server-dev: a page request is addressed by pageId + requestId, an Api
// endpoint routine by endpointId, and a test names exactly one of the two.
const requestTestSchema = {
  type: 'object',
  required: ['name', 'expect'],
  properties: {
    name: {
      type: 'string',
      errorMessage: { type: 'Request test "name" should be a string.' },
    },
    pageId: {
      type: 'string',
      errorMessage: { type: 'Request test "pageId" should be a string.' },
    },
    requestId: {
      type: 'string',
      errorMessage: { type: 'Request test "requestId" should be a string.' },
    },
    endpointId: {
      type: 'string',
      errorMessage: { type: 'Request test "endpointId" should be a string.' },
    },
    user: {
      type: ['string', 'object'],
      errorMessage: {
        type: 'Request test "user" should be a dev user name (string) or an inline user object.',
      },
    },
    payload: {
      type: 'object',
      errorMessage: { type: 'Request test "payload" should be an object.' },
    },
    seed: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          errorMessage: { type: 'Request test "seed" documents should be objects.' },
        },
        errorMessage: {
          type: 'Request test "seed" should map each connectionId to an array of documents.',
        },
      },
      errorMessage: {
        type: 'Request test "seed" should be an object keyed by connectionId.',
      },
    },
    expect: {
      errorMessage: {
        required: 'Request test should have required property "expect".',
      },
    },
  },
  oneOf: [
    {
      required: ['pageId', 'requestId'],
      not: { required: ['endpointId'] },
    },
    {
      required: ['endpointId'],
      not: { anyOf: [{ required: ['pageId'] }, { required: ['requestId'] }] },
    },
  ],
  errorMessage: {
    type: 'Request test should be an object.',
    oneOf:
      'Request test should name exactly one target: "pageId" together with "requestId" for a page request, or "endpointId" for an Api endpoint routine.',
    required: {
      name: 'Request test should have required property "name".',
      expect: 'Request test should have required property "expect".',
    },
  },
};

export default requestTestSchema;
