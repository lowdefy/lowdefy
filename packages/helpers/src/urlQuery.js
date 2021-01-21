/*
  Copyright 2020-2021 Lowdefy, Inc

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

import queryString from 'query-string';

import serializer from './serializer';
import type from './type';

const parse = (str) => {
  const parsed = queryString.parse(str);
  const deserialized = {};
  Object.keys(parsed).forEach((key) => {
    try {
      deserialized[key] = serializer.deserializeFromString(parsed[key]);
    } catch (error) {
      deserialized[key] = parsed[key];
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
    toSerialize[key] = serializer.serializeToString(object[key]);
  });
  return queryString.stringify(toSerialize);
};

export default { stringify, parse };
