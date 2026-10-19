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

const LABELS = {
  eq: 'is',
  ne: 'is not',
  in: 'is any of',
  nin: 'is none of',
  empty: 'is empty',
  notEmpty: 'is not empty',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  endsWith: 'ends with',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  between: 'between',
  before: 'before',
  after: 'after',
  within: 'within',
  isTrue: 'is true',
  isFalse: 'is false',
};

// Array columns (tags, people) read as "has": `in` is any of, `contains` has the value.
const ARRAY_LABELS = {
  in: 'has any of',
  nin: 'has none of',
  contains: 'has',
  notContains: 'does not have',
  eq: 'is exactly',
  ne: 'is not exactly',
};

function getOperatorLabel({ op, family }) {
  if (family === 'array' && ARRAY_LABELS[op]) return ARRAY_LABELS[op];
  return LABELS[op] ?? op;
}

export default getOperatorLabel;
