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

import { type } from '@lowdefy/helpers';

const typesEnum = ['string', 'integer', 'float'];

function generateRandomString(length, randomString = '') {
  randomString += Math.random().toString(36).substr(2, length);
  if (randomString.length > length) return randomString.slice(0, length);
  return generateRandomString(length, randomString);
}

// Both minimum and maximum is inclusive.
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min)) + Math.floor(min));
}
function getRandomFloat(min, max) {
  return Math.random() * (Math.ceil(max) - Math.floor(min)) + Math.floor(min);
}

function evaluateDefaultNumber({ key, defaultValue, params }) {
  if (type.isUndefined(params[key])) {
    params[key] = defaultValue;
  }
  if (!type.isNumber(params[key])) {
    throw new Error(`_random.${key} takes a number type.`);
  }
}

function _random({ params }) {
  if (!type.isString(params) && !type.isObject(params)) {
    throw new Error(`_random takes a string or object type.`);
  }
  if (!type.isObject(params)) {
    params = { type: params };
  }
  if (!typesEnum.includes(params.type)) {
    throw new Error(`_random type can be either 'string', 'integer' or 'float'.`);
  }
  if (params.type === 'float') {
    evaluateDefaultNumber({ key: 'min', defaultValue: 0, params });
    evaluateDefaultNumber({ key: 'max', defaultValue: params.min + 1, params });
    if (params.max < params.min) {
      throw new Error(`_random.min must be less than _random.max.`);
    }
    return getRandomFloat(params.min, params.max);
  }
  if (params.type === 'integer') {
    evaluateDefaultNumber({ key: 'min', defaultValue: 0, params });
    evaluateDefaultNumber({ key: 'max', defaultValue: params.min + 100, params });
    if (params.max < params.min) {
      throw new Error(`_random.min must be less than _random.max.`);
    }
    return getRandomInt(params.min, params.max);
  }
  evaluateDefaultNumber({ key: 'length', defaultValue: 8, params });
  return generateRandomString(params.length);
}

_random.dynamic = true;

export default _random;
