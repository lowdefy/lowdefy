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

function listVariableNames({ value, prefix }) {
  if (!type.isObject(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    listVariableNames({ value: child, prefix: `${prefix}-${key}` })
  );
}

// Whether an app's theme.tailwind sets Tailwind breakpoints of its own: the build writes its keys
// as theme variables, nested keys joined with "-" (getTailwindThemeVars), and a --breakpoint-*
// variable moves or adds a breakpoint, so `md:` may not start at 768px.
function setsTailwindBreakpoints({ tailwind }) {
  if (!type.isObject(tailwind)) return false;
  return Object.entries(tailwind)
    .flatMap(([key, value]) => listVariableNames({ value, prefix: `--${key}` }))
    .some((name) => name.startsWith('--breakpoint'));
}

export default setsTailwindBreakpoints;
