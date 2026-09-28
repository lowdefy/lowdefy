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

import compileCondition from './compileCondition.js';
import resolveToneColor from './resolveToneColor.js';

// Compiles `rules: [{ when, color, className, style }]` once into
// `(row, value) => ({ className, style }) | null`. Every rule whose `when`
// holds applies, in order, so a later rule overrides an earlier one's colour
// or style. `color` is a text colour; status names become theme tokens.
function compileRules({ rules, columnsByKey, column, user, now }) {
  if (!type.isArray(rules) || rules.length === 0) return null;
  const compiled = rules.map((rule) => {
    if (!type.isObject(rule)) {
      throw new Error(`Table rule must be an object. Received ${JSON.stringify(rule)}.`);
    }
    const style = { ...(rule.style ?? {}) };
    const color = resolveToneColor({ color: rule.color, text: true });
    if (!type.isUndefined(color)) style.color = color;
    return {
      test: compileCondition({ condition: rule.when, columnsByKey, column, user, now }),
      className: rule.className,
      style: Object.keys(style).length > 0 ? style : undefined,
    };
  });
  return function applyRules(row, value) {
    let className;
    let style;
    compiled.forEach((rule) => {
      if (!rule.test(row, value)) return;
      if (type.isString(rule.className)) {
        className = type.isUndefined(className) ? rule.className : `${className} ${rule.className}`;
      }
      if (!type.isUndefined(rule.style)) style = { ...(style ?? {}), ...rule.style };
    });
    if (type.isUndefined(className) && type.isUndefined(style)) return null;
    return { className, style };
  };
}

export default compileRules;
