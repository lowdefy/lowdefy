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

const MAX_GROUP = 5;

function parseGroup({ group, fieldsByKey }) {
  if (type.isNone(group)) {
    return [];
  }
  if (!type.isArray(group) || group.length > MAX_GROUP) {
    throw new Error(
      `MongoDBTableQuery view group must be an array of at most ${MAX_GROUP} { key } objects. Received ${JSON.stringify(
        group
      )}.`
    );
  }
  const seen = new Set();
  return group.map((item) => {
    if (!type.isObject(item) || Object.keys(item).some((key) => key !== 'key')) {
      throw new Error(
        `MongoDBTableQuery view group item must be a { key } object. Received ${JSON.stringify(
          item
        )}.`
      );
    }
    const field = getViewField({ fieldsByKey, key: item.key, part: 'group' });
    if (!field.groupable) {
      throw new Error(
        `MongoDBTableQuery field "${field.key}" is not groupable. Set "groupable: true" on the field.`
      );
    }
    // A $group on an array field buckets whole arrays, not their values - never what a
    // grouped table means, so it is refused rather than returned wrong.
    if (field.family === 'array') {
      throw new Error(
        `MongoDBTableQuery field "${field.key}" of type "${field.type}" can not be grouped.`
      );
    }
    if (seen.has(field.key)) {
      throw new Error(`MongoDBTableQuery view groups by "${field.key}" more than once.`);
    }
    seen.add(field.key);
    return { key: field.key };
  });
}

export default parseGroup;
