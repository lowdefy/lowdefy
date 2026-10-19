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

// Every entry's attributes start with one of these keys, since posthog-js sorts them and always
// writes nth-child: the colon before one ends the tag and class part, which can itself hold a
// colon (a Tailwind class like `md:flex`).
const FIRST_ATTRIBUTE_PREFIXES = ['attr_', 'href="', 'nth-child="'];

function isChainHeaderEnd(chain, index) {
  if (chain[index] !== ':') {
    return false;
  }
  const next = index + 1;
  if (next === chain.length || chain[next] === ';') {
    return true;
  }
  return FIRST_ATTRIBUTE_PREFIXES.some((prefix) => chain.startsWith(prefix, next));
}

export default isChainHeaderEnd;
