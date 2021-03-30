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

import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import { type } from '@lowdefy/helpers';

let QuickJsVm;

function regexCaptureFunctionBody({ file, location }) {
  const regex = /^.*function\s*\S+\(\.\.\.args\)\s*(\{.*\})\s*export default .*$/s;
  const match = regex.exec(file);
  if (!match) {
    throw new Error(`Operator Error: _js received invalid javascript file at ${location}.`);
  }
  return match[1];
}

function createFunction({ params, location, methodName }) {
  let body;
  if (params.file) {
    body = regexCaptureFunctionBody({ file: params.file, location });
  } else {
    if (!params.body) {
      throw new Error(
        `Operator Error: _js.${methodName} did not receive a "file" or "body" argument at ${location}.`
      );
    }
    if (!type.isString(params.body)) {
      throw new Error(
        `Operator Error: _js.${methodName} "body" argument should be a string at ${location}.`
      );
    }
    body = params.body;
  }
  const fn = (...args) => {
    const codeHandle = QuickJsVm.unwrapResult(
      QuickJsVm.evalCode(
        `
      var args = JSON.parse('${JSON.stringify(args)}');
      function fn() {
        ${body}
      }
      var result = JSON.stringify(fn());
    `,
        {
          shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + 1000),
          memoryLimitBytes: 1024 * 1024,
        }
      )
    );
    const resultHandle = QuickJsVm.getProp(QuickJsVm.global, 'result');
    codeHandle.dispose();
    return JSON.parse(QuickJsVm.getString(resultHandle));
  };
  return fn;
}

function evaluate({ params, location, methodName }) {
  if (!type.isArray(params.args) && !type.isNone(params.args)) {
    throw new Error(
      `Operator Error: _js.evaluate "args" argument should be an array, null or undefined at ${location}.`
    );
  }
  const fn = createFunction({ params, location, methodName });
  return fn(...(params.args || []));
}

const methods = { evaluate, function: createFunction };

function _js({ params, location, methodName }) {
  if (!QuickJsVm) {
    throw new Error(
      `Operator Error: _js is not initialized. Received: ${JSON.stringify(params)} at ${location}.`
    );
  }
  if (!type.isObject(params)) {
    throw new Error(`Operator Error: _js.${methodName} takes an object as input at ${location}.`);
  }
  if (!methods[methodName]) {
    throw new Error(
      `Operator Error: _js.${methodName} is not supported  at ${location}. Use one of the following: evaluate, function.`
    );
  }

  return methods[methodName]({ params, location, methodName });
}

async function init() {
  const QuickJs = await getQuickJS();
  QuickJsVm = QuickJs.createVm();
}
async function clear() {
  QuickJsVm = null;
}

_js.init = init;
_js.clear = clear;

export default _js;
