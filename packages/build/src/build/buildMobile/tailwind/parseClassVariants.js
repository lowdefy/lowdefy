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

// Splits a class into its variants and utility on the colons outside
// brackets: "dark:sm:bg-[url(a:b)]" gives { variants: ['dark', 'sm'],
// utility: 'bg-[url(a:b)]' }.
function parseClassVariants(className) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of className) {
    if (char === '[' || char === '(') depth += 1;
    if (char === ']' || char === ')') depth -= 1;
    if (char === ':' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  return { variants: parts, utility: current };
}

export default parseClassVariants;
