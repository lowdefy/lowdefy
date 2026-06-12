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

import { get, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Walker resolveVar parity:
// - string form: deep-get from vars, missing → null
// - object form: provided value wins even when null; missing → default ?? null
// - anything else throws the walker's message
// The default expression is evaluated eagerly by the emitted code (the walker
// resolves children before substitution).
function getVar({ scope, def, loc }) {
  if (type.isString(def)) {
    return get(scope.vars, def, { default: null });
  }
  if (type.isObject(def) && type.isString(def.key)) {
    const varFromParent = get(scope.vars, def.key);
    if (!type.isUndefined(varFromParent)) {
      return varFromParent;
    }
    if (def.hasDefault) {
      return type.isNone(def.default) ? null : def.default;
    }
    return null;
  }
  throw new ConfigError('_var operator takes a string or object with "key" field as arguments.', {
    filePath: loc?.file,
    lineNumber: loc?.line,
  });
}

export default getVar;
