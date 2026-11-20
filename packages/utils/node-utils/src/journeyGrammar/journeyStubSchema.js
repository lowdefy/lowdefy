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

// One entry of a journey's `stubs` list as a JSON schema, for agents to read. The grammar itself
// is validateJourneyStub; its tests check this schema accepts and refuses the same entries.

const nonEmptyString = { type: 'string', minLength: 1 };

const NARROWING = {
  requestId: {
    ...nonEmptyString,
    description: "The request's id on a page, or its step id in an endpoint routine.",
  },
  endpoint: {
    ...nonEmptyString,
    description: 'Only requests made by this endpoint, when two routines share a request id.',
  },
  pageId: {
    ...nonEmptyString,
    description: 'Only requests made on this page, when two pages share a request id.',
  },
};

const ANSWER = {
  title: 'Answer stub',
  description:
    'Answers an outside request with `answer` in place of the null an outside connection gives under a data set. The first stub that matches a request answers it; the request is recorded in sunk.',
  type: 'object',
  properties: {
    connectionType: { ...nonEmptyString, description: 'The connection type, e.g. AxiosHttp.' },
    requestType: { ...nonEmptyString, description: 'The request type, e.g. AxiosHttp.' },
    answer: { description: 'What the request answers, as written.' },
    ...NARROWING,
    match: {
      type: 'object',
      description:
        'A partial match on the request properties as sunk records them: the request must hold every value named.',
    },
  },
  required: ['connectionType', 'requestType', 'answer'],
  additionalProperties: false,
};

const FAIL = {
  title: 'Forced failure',
  description:
    'Makes a request throw a ServiceError with the `fail` message before it runs, on any connection, MongoDB included. Every other request runs for real.',
  type: 'object',
  properties: {
    ...NARROWING,
    fail: { ...nonEmptyString, description: 'The message the request fails with.' },
    times: {
      description:
        'How many matching requests fail: 1 by default, a whole number, or "all" for every one in the journey.',
      oneOf: [{ type: 'integer', minimum: 1 }, { const: 'all' }],
    },
  },
  required: ['requestId', 'fail'],
  additionalProperties: false,
};

const journeyStubSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Journey stub',
  description:
    "One entry of a journey's `stubs`: an answer stub ({ connectionType, requestType, answer, requestId?, endpoint?, pageId?, match? }) or a forced failure ({ requestId, endpoint?, pageId?, fail, times? }).",
  oneOf: [ANSWER, FAIL],
};

export default journeyStubSchema;
