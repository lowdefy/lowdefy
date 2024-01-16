/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { ObjectId } from 'mongodb';
import { serializer, type } from '@lowdefy/helpers';

function replacer(_, value) {
  if (type.isObject(value)) {
    Object.keys(value).forEach((key) => {
      if (value[key] instanceof ObjectId) {
        // eslint-disable-next-line no-param-reassign
        value[key] = { _oid: value[key].toHexString() };
      }
    });

    return value;
  }
  if (type.isArray(value)) {
    return value.map((item) => {
      if (item instanceof ObjectId) {
        return { _oid: item.toHexString() };
      }
      return item;
    });
  }
  return value;
}

function reviver(key, value) {
  if (type.isObject(value)) {
    if (value._oid) {
      return ObjectId.createFromHexString(value._oid);
    }
  }
  return value;
}

function serialize(obj) {
  return serializer.copy(obj, { replacer });
}

function deserialize(obj) {
  return serializer.copy(obj, { reviver });
}

export { serialize, deserialize };
