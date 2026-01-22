/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { get, serializer, type } from '@lowdefy/helpers';

/**
 * Copies a _var value while preserving source location markers.
 *
 * When _var copies a value from vars into a template, we need to preserve
 * the ~r (ref ID) and ~l (line number) from WHERE THE VALUE IS DEFINED
 * (the source file), not where _var is used (the template).
 *
 * The issue is that serializer.copy loses non-enumerable properties, and
 * recursiveBuild.js then sets ~r to the template file for objects without ~r.
 *
 * This function preserves the source location by making ~r enumerable on
 * the copied value, so it survives through subsequent serializer.copy calls.
 *
 * @param {*} value - The value to copy from vars
 * @param {string} sourceRefId - The ref ID of the source file where the var is defined
 * @returns {*} The copied value with preserved source location markers
 */
function copyVarValue(value, sourceRefId) {
  if (!type.isObject(value) && !type.isArray(value)) {
    return value;
  }

  // Copy the value, preserving ~l and setting ~r to the source file
  return serializer.copy(value, {
    reviver: (_, v) => {
      if (type.isObject(v)) {
        // Preserve the source file's ref ID by setting it explicitly
        // This prevents recursiveBuild from overwriting it with the template's ref ID
        if (sourceRefId && v['~r'] === undefined) {
          v['~r'] = sourceRefId;
        }
      }
      return v;
    },
  });
}

function refReviver(key, value) {
  if (type.isObject(value)) {
    if (!type.isUndefined(value._ref)) {
      return this.parsedFiles[value._ref.id];
    }
    if (value._var) {
      if (type.isString(value._var)) {
        const varValue = get(this.vars, value._var, { default: null });
        return copyVarValue(varValue, this.sourceRefId);
      }
      if (type.isObject(value._var) && type.isString(value._var.key)) {
        const varValue = get(this.vars, value._var.key, {
          default: type.isNone(value._var.default) ? null : value._var.default,
        });
        return copyVarValue(varValue, this.sourceRefId);
      }
      throw new Error(
        `"_var" operator takes a string or object with "key" field as arguments. Received "${JSON.stringify(
          value
        )}"`
      );
    }
  }
  return value;
}

function populateRefs({ parsedFiles, refDef, toPopulate }) {
  // Use serializer.copy to preserve non-enumerable properties like ~r, ~k, ~l
  // sourceRefId is the PARENT file's ref ID where vars are defined (not the template's ID)
  return serializer.copy(toPopulate, {
    reviver: refReviver.bind({ parsedFiles, vars: refDef.vars, sourceRefId: refDef.parent }),
  });
}

export default populateRefs;
