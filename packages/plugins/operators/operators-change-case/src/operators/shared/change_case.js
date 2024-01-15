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
/* eslint-disable import/namespace */
import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pascalSnakeCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from 'change-case';
import { get, type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

const changeCase = {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  noCase,
  pascalCase,
  pascalSnakeCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
};

const prep = (args, { location }) => {
  const options = args[1];
  if (!type.isNone(options) && !type.isObject(options)) {
    throw new Error(
      `Operator Error: options must be an object. Received ${JSON.stringify(
        options
      )} at ${location}.`
    );
  }
  return args;
};

const convertArray = ({ methodName, on, options }) => {
  return on.map((item) => {
    if (type.isString(item)) {
      return changeCase[methodName](item, options);
    }
    return item;
  });
};

const convertObject = ({ methodName, on, options }) => {
  const result = {};
  const keyConverter = get(options, 'convertKeys')
    ? (key) => changeCase[methodName](key, options)
    : (key) => key;
  const valueConverter = get(options, 'convertValues', { default: true })
    ? (val) => changeCase[methodName](val, options)
    : (val) => val;

  Object.entries(on).forEach(([key, value]) => {
    if (type.isString(value)) {
      result[keyConverter(key)] = valueConverter(value);
    } else {
      result[keyConverter(key)] = value;
    }
  });
  return result;
};

const makeCaseChanger =
  ({ methodName }) =>
  (on, options = {}) => {
    if (type.isString(on)) {
      return changeCase[methodName](on, options);
    }
    if (type.isArray(on)) {
      return convertArray({ methodName, on, options });
    }
    if (type.isObject(on)) {
      return convertObject({ methodName, on, options });
    }
    return on;
  };

const functions = {};
const meta = {};

Object.keys(changeCase).forEach((methodName) => {
  functions[methodName] = makeCaseChanger({ methodName });
  meta[methodName] = { namedArgs: ['on', 'options'], validTypes: ['array', 'object'], prep };
});

function change_case({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_change_case',
    params,
  });
}

export default change_case;
