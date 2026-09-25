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

import classifyOperatorCall from './classifyOperatorCall.js';
import classifyReadKeys from './classifyReadKeys.js';
import isPlainObject from './isPlainObject.js';

const dependsOnCall = Symbol('dependsOnCall');

// Follows a method-level declaration to the one that applies to methodName, as classifyOperatorCall
// does, but without calling anything: a function on the way means the classification depends on
// the call.
function resolveWithoutCall({ declaration, methodName }) {
  if (typeof declaration === 'function') return dependsOnCall;
  if (!isPlainObject(declaration) || declaration.kind !== undefined) return declaration;
  const methods = declaration.methods ?? {};
  const methodDeclaration =
    typeof methodName === 'string' && Object.prototype.hasOwnProperty.call(methods, methodName)
      ? methods[methodName]
      : declaration.default;
  return resolveWithoutCall({ declaration: methodDeclaration, methodName });
}

// Classifies an operator's calls, resolving once per method name whatever of its declaration does
// not depend on the call. Most declarations are static ({ kind: 'pure' }), so most calls cost a Map
// lookup; only function declarations and read keys functions run per call.
function createOperatorCallClassifier({ operatorFn, operatorName }) {
  const byMethodName = new Map();

  function classifyGeneral(callInfo) {
    return classifyOperatorCall({ callInfo, operatorFn, operatorName });
  }

  // Returns a classification, or a function of the call info that returns one.
  function resolveMethod(methodName) {
    const declaration = resolveWithoutCall({ declaration: operatorFn.tracking, methodName });
    if (declaration === dependsOnCall) {
      return classifyGeneral;
    }
    if (
      isPlainObject(declaration) &&
      declaration.kind === 'read' &&
      typeof declaration.keys === 'function'
    ) {
      const callName =
        typeof methodName === 'string' ? `${operatorName}.${methodName}` : operatorName;
      return (callInfo) => classifyReadKeys({ callInfo, callName, declaration });
    }
    return classifyOperatorCall({ callInfo: { methodName }, operatorFn, operatorName });
  }

  return function classify(operatorContext) {
    const { methodName } = operatorContext;
    let resolved = byMethodName.get(methodName);
    if (resolved === undefined) {
      resolved = resolveMethod(methodName);
      byMethodName.set(methodName, resolved);
    }
    if (typeof resolved !== 'function') return resolved;
    const { arrayIndices, jsMap, location, params } = operatorContext;
    return resolved({ arrayIndices, jsMap, location, methodName, params });
  };
}

export default createOperatorCallClassifier;
