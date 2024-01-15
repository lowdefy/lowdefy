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

import serializer from './serializer.js';
import type from './type.js';

const parse = (str) => {
  const parsed = new URLSearchParams(str);
  const deserialized = {};
  parsed.forEach((value, key) => {
    try {
      deserialized[key] = serializer.deserializeFromString(value);
    } catch (error) {
      deserialized[key] = value;
    }
  });
  return deserialized;
};

const stringify = (object) => {
  if (!type.isObject(object)) {
    return '';
  }
  const toSerialize = {};
  Object.keys(object).forEach((key) => {
    toSerialize[key] = type.isString(object[key])
      ? object[key]
      : serializer.serializeToString(object[key]);
  });
  return new URLSearchParams(toSerialize).toString();
};

export default { stringify, parse };
