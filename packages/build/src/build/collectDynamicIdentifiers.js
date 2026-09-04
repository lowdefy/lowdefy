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

// _prop and _slot are build-time component markers, not operators: expandComponent
// resolves them per use site, long after precompute. They are registered here so
// precompute leaves a component body's markers alone while still folding the build
// operators around them, and so a marker is never mistaken for an operator typo.
const COMPONENT_MARKER_IDENTIFIERS = ['_prop', '_slot'];

function collectDynamicIdentifiers({ operators }) {
  const dynamicIdentifiers = new Set(COMPONENT_MARKER_IDENTIFIERS);

  Object.entries(operators).forEach(([operatorName, operatorFn]) => {
    if (!type.isFunction(operatorFn)) return;

    if (operatorFn.dynamic === true) {
      dynamicIdentifiers.add(operatorName);
      return;
    }

    // Check for method-level dynamic in meta
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

export default collectDynamicIdentifiers;
