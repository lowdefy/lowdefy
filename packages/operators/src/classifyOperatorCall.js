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

import classifyReadKeys from './classifyReadKeys.js';
import isPlainObject from './isPlainObject.js';

const kinds = new Set(['pure', 'read', 'untracked', 'volatile']);

// A declaration is { kind, keys? }, a function of the call returning one, or a method-level
// { methods: { [methodName]: declaration }, default: declaration } - which may nest the other two.
function resolveDeclaration({ callInfo, declaration }) {
  if (typeof declaration === 'function') {
    return resolveDeclaration({ callInfo, declaration: declaration(callInfo) });
  }
  if (!isPlainObject(declaration) || declaration.kind !== undefined) {
    return declaration;
  }
  const methods = declaration.methods ?? {};
  // hasOwnProperty, so a methodName like "constructor" can not pick up Object.prototype members.
  const methodDeclaration =
    typeof callInfo.methodName === 'string' &&
    Object.prototype.hasOwnProperty.call(methods, callInfo.methodName)
      ? methods[callInfo.methodName]
      : declaration.default;
  return resolveDeclaration({ callInfo, declaration: methodDeclaration });
}

function untracked(reason) {
  return { kind: 'untracked', keys: [], reason };
}

const noKeys = Object.freeze([]);

// Runs on every recorded operator call whose declaration depends on the call, so types are tested
// natively: type.isObject and type.isFunction walk kindOf's instanceof chain, which costs more than
// the classification itself.
function classifyOperatorCall({ callInfo, operatorFn, operatorName }) {
  const callName =
    typeof callInfo.methodName === 'string'
      ? `${operatorName}.${callInfo.methodName}`
      : operatorName;
  if (operatorFn.tracking === undefined) {
    return untracked(`${callName} has no tracking declaration`);
  }
  let declaration;
  try {
    declaration = resolveDeclaration({ callInfo, declaration: operatorFn.tracking });
  } catch (error) {
    // Declarations ship with plugins. One that throws must cost its block the tracking win, not the
    // page its evaluation.
    return untracked(`${callName} tracking declaration threw: ${error.message}`);
  }
  if (!isPlainObject(declaration) || !kinds.has(declaration.kind)) {
    return untracked(`${callName} has an invalid tracking declaration`);
  }
  if (declaration.kind === 'read') {
    return classifyReadKeys({ callInfo, callName, declaration });
  }
  return {
    kind: declaration.kind,
    keys: noKeys,
    reason: callName,
    resultMayContainFunctions: declaration.resultMayContainFunctions === true,
  };
}

export default classifyOperatorCall;
