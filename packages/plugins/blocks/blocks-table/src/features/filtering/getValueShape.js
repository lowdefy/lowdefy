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

const SHAPES = {
  empty: 'none',
  notEmpty: 'none',
  isTrue: 'none',
  isFalse: 'none',
  in: 'list',
  nin: 'list',
  between: 'range',
  within: 'relative',
};

// What an operator's value looks like: none, a list, a [from, to] range, a relative date
// `{ last | next, unit }`, or one scalar.
function getValueShape(op) {
  return SHAPES[op] ?? 'scalar';
}

export default getValueShape;
