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

function evaluateDefaultNumber({ key, defaultValue, params, location }) {
  if (type.isUndefined(params[key])) {
    params[key] = defaultValue;
  }
  if (!type.isNumber(params[key])) {
    throw new Error(
      `Operator Error: _random.${key} takes an number type. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _random({ location, params }) {
  if (!type.isString(params) && !type.isObject(params)) {
    throw new Error(
      `Operator Error: _random takes an string or object type. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (!type.isObject(params)) {
    params = { type: params };
  }
  if (!typesEnum.includes(params.type)) {
    throw new Error(
      `Operator Error: _random type can be either 'string', 'integer' or 'float'. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.type === 'float') {
    evaluateDefaultNumber({ key: 'min', defaultValue: 0, params, location });
    evaluateDefaultNumber({ key: 'max', defaultValue: params.min + 1, params, location });
    if (params.max < params.min) {
      throw new Error(
        `Operator Error: _random.min must be less than _random.max. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    return getRandomFloat(params.min, params.max);
  }
  if (params.type === 'integer') {
    evaluateDefaultNumber({ key: 'min', defaultValue: 0, params, location });
    evaluateDefaultNumber({ key: 'max', defaultValue: params.min + 100, params, location });
    if (params.max < params.min) {
      throw new Error(
        `Operator Error: _random.min must be less than _random.max. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    return getRandomInt(params.min, params.max);
  }
  evaluateDefaultNumber({ key: 'length', defaultValue: 8, params, location });
  return generateRandomString(params.length);
}

export default _random;
