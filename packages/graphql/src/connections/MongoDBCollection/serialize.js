/*
  Copyright 2020 Lowdefy, Inc

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

import { ObjectID } from 'mongodb';
import { type } from '@lowdefy/helpers';

function replacer(_, value) {
  if (type.isObject(value)) {
    Object.keys(value).forEach((key) => {
      if (value[key] instanceof ObjectID) {
        // eslint-disable-next-line no-param-reassign
        value[key] = { _oid: value[key].toHexString() };
      }
      if (type.isDate(value[key])) {
        // eslint-disable-next-line no-param-reassign
        value[key] = { _date: value[key].valueOf() };
      }
    });

    return value;
  }
  if (type.isArray(value)) {
    return value.map((item) => {
      if (item instanceof ObjectID) {
        return { _oid: item.toHexString() };
      }
      if (type.isDate(item)) {
        return { _date: item.valueOf() };
      }
      return item;
    });
  }
  return value;
}

function reviver(key, value) {
  if (type.isObject(value)) {
    if (value._oid) {
      return ObjectID.createFromHexString(value._oid);
    }
    if (type.isInt(value._date) || type.isString(value._date)) {
      return new Date(value._date);
    }
  }
  return value;
}

function serialize(obj) {
  if (type.isUndefined(obj)) return obj;
  return JSON.parse(JSON.stringify(obj, replacer));
}

// need to use replacer here, since objects are already partially deserialised.
// otherwise dates become strings
function deserialize(obj) {
  if (type.isUndefined(obj)) return obj;
  return JSON.parse(JSON.stringify(obj, replacer), reviver);
}

export { serialize, deserialize };
