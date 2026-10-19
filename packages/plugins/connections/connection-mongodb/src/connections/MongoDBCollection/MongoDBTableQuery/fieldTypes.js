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

// The Table's field type table: which filter operators and aggregate functions each column
// type allows. The server enforces it: a view operator or aggregate outside this table never
// reaches MongoDB. The operators are exactly the ones the Table's filter menus offer
// (test/tableFilterOperators.json, a copy of the fixture blocks-antd tests its menus against),
// so no operator a user can pick breaks the table's fetch.

const allOperators = ['eq', 'ne', 'in', 'nin', 'empty', 'notEmpty'];
const allAggregates = ['count', 'countDistinct', 'countEmpty', 'countNotEmpty', 'percentEmpty'];

const families = {
  // min and max of text compare strings, as the Table's own footers do.
  text: {
    operators: [...allOperators, 'contains', 'notContains', 'startsWith', 'endsWith'],
    aggregates: [...allAggregates, 'min', 'max'],
  },
  numeric: {
    operators: [...allOperators, 'gt', 'gte', 'lt', 'lte', 'between'],
    aggregates: [...allAggregates, 'sum', 'avg', 'min', 'max'],
  },
  date: {
    operators: [...allOperators, 'before', 'after', 'between', 'within'],
    aggregates: [...allAggregates, 'earliest', 'latest'],
  },
  boolean: {
    operators: [...allOperators, 'isTrue', 'isFalse'],
    aggregates: allAggregates,
  },
  // Array values (tags, people): in = has any of, nin = has none of, contains = has the value,
  // notContains = does not have the value.
  array: {
    operators: [...allOperators, 'contains', 'notContains'],
    aggregates: allAggregates,
  },
  other: {
    operators: allOperators,
    aggregates: allAggregates,
  },
};

const familyByType = {
  text: 'text',
  email: 'text',
  phone: 'text',
  url: 'text',
  link: 'text',
  html: 'text',
  relation: 'text',
  tag: 'text',
  status: 'text',
  number: 'numeric',
  currency: 'numeric',
  percent: 'numeric',
  progress: 'numeric',
  rating: 'numeric',
  date: 'date',
  datetime: 'date',
  boolean: 'boolean',
  tags: 'array',
  people: 'array',
  avatar: 'text',
  image: 'other',
  json: 'other',
};

// The family whose values MongoDBTableChanges writes, where it differs. An avatar filters as
// text, the name at its path as the Table filters it, but its cell may hold a document such
// as { name, src }, which is written like an image or json value.
const writeFamilyByType = {
  avatar: 'other',
};

const fieldTypes = {};
Object.entries(familyByType).forEach(([fieldType, family]) => {
  fieldTypes[fieldType] = {
    family,
    writeFamily: writeFamilyByType[fieldType] ?? family,
    ...families[family],
  };
});

export default fieldTypes;
