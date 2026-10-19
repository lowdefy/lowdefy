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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function withoutCssKeys({ found, value }) {
  if (type.isArray(value)) {
    return value.map((item) => withoutCssKeys({ found, value: item }));
  }
  if (!type.isObject(value)) return value;
  const cssKeys = Object.keys(value).filter((key) => key.startsWith('.'));
  if (cssKeys.length === 0) return value;
  found.push(...cssKeys);
  const result = { ...value };
  cssKeys.forEach((key) => {
    delete result[key];
  });
  return result;
}

// An operator's result is a class value: a string, an array, or { className: boolean }. Only
// config can map CSS keys (.element), so a map an operator returns would apply its keys as
// literal class names.
function validateClassEval({ blockId, classEval, configKey }) {
  if (!type.isObject(classEval.output)) return classEval;
  const found = [];
  const output = {};
  Object.keys(classEval.output).forEach((cssKey) => {
    output[cssKey] = withoutCssKeys({ found, value: classEval.output[cssKey] });
  });
  if (found.length === 0) return classEval;
  const keys = found.map((key) => `"${key}"`).join(', ');
  return {
    output,
    errors: [
      ...classEval.errors,
      new ConfigError(
        `Block "${blockId}": an operator in class returned a map of CSS keys (${keys}). An operator sets the classes of the CSS key it sits under, the block itself at the root of class, so put an operator under each CSS key instead.`,
        { configKey }
      ),
    ],
  };
}

export default validateClassEval;
