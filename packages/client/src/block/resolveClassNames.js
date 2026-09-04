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

import { cn } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

// A block's `class:` is normalised to slots by the build, but a skeleton's is
// not - it reaches the client as the string, array or slot object the app author
// wrote. A bare value is the block slot.
function resolveClassNames(evalClass) {
  if (!evalClass) return {};
  if (!type.isObject(evalClass)) return { block: cn(evalClass) };
  const resolved = {};
  for (const [key, value] of Object.entries(evalClass)) {
    resolved[key] = cn(value);
  }
  return resolved;
}

export default resolveClassNames;
