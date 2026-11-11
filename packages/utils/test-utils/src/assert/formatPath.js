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

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// The path to a nested value as it would be written in JavaScript: order.items[0].price.
function formatPath(path) {
  return path.reduce((text, key) => {
    if (typeof key === 'number') return `${text}[${key}]`;
    if (identifierPattern.test(key)) return text === '' ? key : `${text}.${key}`;
    return `${text}[${JSON.stringify(key)}]`;
  }, '');
}

export default formatPath;
