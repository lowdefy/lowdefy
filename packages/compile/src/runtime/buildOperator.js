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
import { evaluateOperators } from '@lowdefy/operators';
import operatorsJsBuild from '@lowdefy/operators-js/operators/build';
import * as operatorsNunjucksBuild from '@lowdefy/operators-nunjucks/operators/build';

// The build-time operator set: the shared operator barrel plus _env, plus
// _build.nunjucks (string templating — the blessed replacement for
// string-built ids after .yaml.njk removal).
const operators = { ...operatorsJsBuild, ...operatorsNunjucksBuild };

// Ported from @lowdefy/build collectDynamicIdentifiers — S1 moves the
// canonical export here. Dynamic operators defer evaluation when their
// children carry runtime markers; identifiers are derived from operator meta.
function collectDynamicIdentifiers(ops) {
  const dynamicIdentifiers = new Set();
  Object.entries(ops).forEach(([operatorName, operatorFn]) => {
    if (!type.isFunction(operatorFn)) return;
    if (operatorFn.dynamic === true) {
      dynamicIdentifiers.add(operatorName);
      return;
    }
    if (type.isObject(operatorFn.meta)) {
      Object.entries(operatorFn.meta).forEach(([methodName, methodMeta]) => {
        if (type.isObject(methodMeta) && methodMeta.dynamic === true) {
          dynamicIdentifiers.add(`${operatorName}.${methodName}`);
        }
      });
    }
  });
  return dynamicIdentifiers;
}

const dynamicIdentifiers = collectDynamicIdentifiers(operators);

// Walker evaluateBuildOperator parity: evaluate through the same
// evaluateOperators with the _build. prefix; errors are collected with the
// source file attached (never thrown through a factory run), and the
// operator's output replaces the node — undefined on error, like the walker.
function buildOperator({ scope, node, loc }) {
  const { output, errors } = evaluateOperators({
    input: node,
    operators,
    operatorPrefix: '_build.',
    env: scope.env ?? process.env,
    dynamicIdentifiers,
  });
  if (errors.length > 0) {
    errors.forEach((error) => {
      error.filePath = error.filePath ?? loc?.file;
      error.lineNumber = error.lineNumber ?? loc?.line;
      if (scope.onError) {
        scope.onError(error);
      } else {
        throw error;
      }
    });
  }
  return output;
}

export default buildOperator;
