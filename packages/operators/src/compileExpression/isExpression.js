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

// Intent test: a scalar is treated as an expression iff, after trimming, it
// starts with "${" and not "$${" (the literal escape, §7). Starting with "${"
// is a strong enough signal that a malformed body (missing "}", interpolation)
// is a mistake to report rather than a literal to keep — compileExpression
// validates well-formedness and raises a ConfigError. There is no interpolation:
// "foo ${x}" does not start with "${" and stays a literal string.
function isExpression(value) {
  if (!type.isString(value)) return false;
  const trimmed = value.trim();
  return trimmed.startsWith('${') && !trimmed.startsWith('$${');
}

export default isExpression;
