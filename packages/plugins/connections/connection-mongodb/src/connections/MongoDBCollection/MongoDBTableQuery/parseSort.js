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

import getViewField from './getViewField.js';

const MAX_SORT = 10;

function parseSort({ sort, fieldsByKey }) {
  if (type.isNone(sort)) {
    return [];
  }
  if (!type.isArray(sort) || sort.length > MAX_SORT) {
    throw new Error(
      `MongoDBTableQuery view sort must be an array of at most ${MAX_SORT} { key, desc } objects. Received ${JSON.stringify(
        sort
      )}.`
    );
  }
  return sort.map((item) => {
    if (!type.isObject(item) || Object.keys(item).some((key) => key !== 'key' && key !== 'desc')) {
      throw new Error(
        `MongoDBTableQuery view sort item must be a { key, desc } object. Received ${JSON.stringify(
          item
        )}.`
      );
    }
    const field = getViewField({ fieldsByKey, key: item.key, part: 'sort' });
    if (!field.sortable) {
      throw new Error(`MongoDBTableQuery field "${field.key}" is not sortable.`);
    }
    if (!type.isNone(item.desc) && !type.isBoolean(item.desc)) {
      throw new Error(
        `MongoDBTableQuery view sort "desc" on "${
          field.key
        }" is not a boolean. Received ${JSON.stringify(item.desc)}.`
      );
    }
    return { key: field.key, desc: item.desc === true };
  });
}

export default parseSort;
