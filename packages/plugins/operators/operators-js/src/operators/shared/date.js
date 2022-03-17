/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { runClass } from '@lowdefy/operators';

function date(input) {
  const result = new Date(input);
  if (!type.isDate(result)) {
    throw new Error(`${input} could not resolve as a valid javascript date.`);
  }
  return result;
}

function now() {
  return new Date();
}

const functions = {
  __default: date,
  now,
};

const meta = {
  __default: { singleArg: true, validTypes: ['number', 'string'] },
  now: { noArgs: true },
};

function _date({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName: methodName,
    operator: '_date',
    params,
    defaultFunction: '__default',
  });
}

export default _date;
