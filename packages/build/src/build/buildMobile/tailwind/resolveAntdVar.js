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

const antdVarPattern = /^var\(\s*(--ant-[\w-]+)\s*(?:,\s*(.+))?\)$/;

// Resolves a Tailwind theme value that points at an antd CSS variable
// ("var(--ant-color-primary)") to the computed token for one mode. Any other
// var() cannot be resolved without a browser, so it comes back undefined.
function resolveAntdVar({ value, tokenVars }) {
  if (typeof value !== 'string' || !value.includes('var(')) {
    return value;
  }
  const match = value.trim().match(antdVarPattern);
  if (!match) {
    return undefined;
  }
  return tokenVars[match[1]] ?? match[2];
}

export default resolveAntdVar;
