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

import { type } from '@lowdefy/helpers';

function regexCaptureFunctionBody({ file, location }) {
  const regex = /^.*function\s*\S+\(\.\.\.args\)\s*(\{.*\})\s*export default .*$/s;
  const match = regex.exec(file);
  if (!match) {
    throw new Error(
      `Operator Error: _experimental_unsafe_js received invalid javascript file at ${location}.`
    );
  }
  return match[1];
}

function createFunction({ params, location }) {
  let body;
  if (params.file) {
    body = regexCaptureFunctionBody({ file: params.file, location });
  } else {
    if (!params.body) {
      throw new Error(
        `Operator Error: _experimental_unsafe_js did not receive a "file" or "body" argument at ${location}.`
      );
    }
    if (!type.isString(params.body)) {
      throw new Error(
        `Operator Error: _experimental_unsafe_js  "body" argument should be a string at ${location}.`
      );
    }
    body = params.body;
  }
  return new Function('...args', body);
}

function evaluate({ params, location }) {
  if (!type.isArray(params.args)) {
    throw new Error(
      `Operator Error: _experimental_unsafe_js.evaluate  "args" argument should be an array at ${location}.`
    );
  }
  const fn = createFunction({ params, location });
  return fn(...params.args);
}

const methods = {
  function: createFunction,
  evaluate,
};

function _experimental_unsafe_js({ params, methodName, location }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _experimental_unsafe_js takes an object as input at ${location}.`
    );
  }
  if (!methods[methodName]) {
    throw new Error(
      `Operator Error: _experimental_unsafe_js.${methodName} is not supported  at ${location}. Use one of the following: evaluate, function.`
    );
  }

  return methods[methodName]({ params, location });
}

export default _experimental_unsafe_js;
