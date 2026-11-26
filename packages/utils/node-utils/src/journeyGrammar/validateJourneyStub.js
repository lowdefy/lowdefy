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

import { type } from '@lowdefy/helpers';

const ANSWER_KEYS = [
  'connectionType',
  'requestType',
  'answer',
  'requestId',
  'endpoint',
  'pageId',
  'match',
];
const FAIL_KEYS = ['requestId', 'endpoint', 'pageId', 'fail', 'times'];

const SHAPE =
  'A journey stub should be an answer, { connectionType, requestType, answer, requestId?, endpoint?, pageId?, match? }, or a forced failure, { requestId, endpoint?, pageId?, fail, times? }.';

function describe(value) {
  return JSON.stringify(value);
}

function isText(value) {
  return type.isString(value) && value !== '';
}

function findUnknownKey({ keys, stub }) {
  return Object.keys(stub).find((key) => !keys.includes(key));
}

function checkText({ key, stub, required }) {
  if (type.isUndefined(stub[key])) {
    return required ? `A journey stub needs "${key}".` : undefined;
  }
  if (!isText(stub[key])) {
    return `Journey stub "${key}" should be a non-empty string. Received ${describe(stub[key])}.`;
  }
  return undefined;
}

function validateFail({ stub }) {
  const unknown = findUnknownKey({ keys: FAIL_KEYS, stub });
  if (!type.isUndefined(unknown)) {
    return `A forced failure stub does not take "${unknown}". It takes ${FAIL_KEYS.join(', ')}.`;
  }
  const textError = ['requestId', 'endpoint', 'pageId', 'fail']
    .map((key) => checkText({ key, stub, required: key === 'requestId' || key === 'fail' }))
    .find((error) => !type.isUndefined(error));
  if (!type.isUndefined(textError)) {
    return textError;
  }
  const { times } = stub;
  if (!type.isUndefined(times) && times !== 'all' && !(type.isInt(times) && times > 0)) {
    return `Journey stub "times" should be a whole number above 0 or "all". Received ${describe(
      times
    )}.`;
  }
  return undefined;
}

function validateAnswer({ stub }) {
  const unknown = findUnknownKey({ keys: ANSWER_KEYS, stub });
  if (!type.isUndefined(unknown)) {
    return `An answer stub does not take "${unknown}". It takes ${ANSWER_KEYS.join(', ')}.`;
  }
  const textError = ['connectionType', 'requestType', 'requestId', 'endpoint', 'pageId']
    .map((key) =>
      checkText({ key, stub, required: key === 'connectionType' || key === 'requestType' })
    )
    .find((error) => !type.isUndefined(error));
  if (!type.isUndefined(textError)) {
    return textError;
  }
  if (!Object.hasOwn(stub, 'answer')) {
    return 'An answer stub needs "answer", what the request answers.';
  }
  if (!type.isUndefined(stub.match) && !type.isObject(stub.match)) {
    return `Journey stub "match" should be an object of the request values to match. Received ${describe(
      stub.match
    )}.`;
  }
  return undefined;
}

// One entry of a journey's `stubs`: an answer for an outside request, or a forced failure of any
// request. `fail` makes it a forced failure. Returns { error } or {}.
function validateJourneyStub({ stub }) {
  if (!type.isObject(stub)) {
    return { error: `${SHAPE} Received ${describe(stub)}.` };
  }
  const error = Object.hasOwn(stub, 'fail') ? validateFail({ stub }) : validateAnswer({ stub });
  return type.isUndefined(error) ? {} : { error };
}

export default validateJourneyStub;
