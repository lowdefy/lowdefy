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

import { get, type } from '@lowdefy/helpers';

function refReviver(key, value) {
  if (type.isObject(value)) {
    if (!type.isUndefined(value._ref)) {
      return this.parsedFiles[value._ref.id];
    }
    if (value._var) {
      if (type.isString(value._var)) {
        return JSON.parse(JSON.stringify(get(this.vars, value._var, { default: null })));
      }
      if (type.isObject(value._var) && type.isString(value._var.key)) {
        return JSON.parse(
          JSON.stringify(
            get(this.vars, value._var.key, {
              default: type.isNone(value._var.default) ? null : value._var.default,
            })
          )
        );
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
  return JSON.parse(
    JSON.stringify(toPopulate),
    refReviver.bind({ parsedFiles, vars: refDef.vars })
  );
}

export default populateRefs;
