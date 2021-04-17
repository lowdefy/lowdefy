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
import { type, serializer } from '@lowdefy/helpers';

let QuickJsVm;

function createFunction({ params, location, methodName }) {
  if (!params.code || !type.isString(params.code)) {
    throw new Error(
      `Operator Error: _js.${methodName} "code" argument should be a string at ${location}.`
    );
  }
  const fn = (...args) => {
    const jsFnString = `
    var logs = [];
    function log(...item) {
      logs.push(item);
    }
    var console = {
      log,
    };
    function dateReviver(key, value) {
      if (typeof value === 'object' && value !== null && value.hasOwnProperty('_date')) {
        var date = new Date(value._date);
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date;
        }
      }
      return value;
    }
    function dateSerialize(key, value) {
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((k) => {
          if (value[k] instanceof Date && !Number.isNaN(value[k].getTime())) {
            value[k] = { "_date": value[k].valueOf() };
          }
        })
      }
      return value;
    }
    var args = JSON.parse(decodeURIComponent("${encodeURIComponent(
      serializer.serializeToString(args)
    )}"), dateReviver);
    var fnResult = (${params.code})(...(args || []));
    var result = encodeURIComponent(JSON.stringify([fnResult, logs], dateSerialize));
  `;
    const codeHandle = QuickJsVm.unwrapResult(
      QuickJsVm.evalCode(jsFnString, {
        shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + 1000),
        memoryLimitBytes: 1024 * 1024,
      })
    );
    const resultHandle = QuickJsVm.getProp(QuickJsVm.global, 'result');
    codeHandle.dispose();
    const result = serializer.deserializeFromString(
      decodeURIComponent(QuickJsVm.getString(resultHandle))
    );
    result[1].forEach((item) => {
      console.log(...item);
    });
    return result[0];
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
      `Operator Error: _js.${methodName} is not supported at ${location}. Use one of the following: evaluate, function.`
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
