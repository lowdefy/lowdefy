/*
  Copyright 2020-2022 Lowdefy, Inc

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

const runClass = ({ meta, methodName, operator, params, functions, defaultFunction }) => {
  if (!methodName) {
    if (meta[params]) {
      methodName = params;
    } else if (defaultFunction) {
      methodName = defaultFunction;
    } else {
      throw new Error(
        `${operator} requires a valid method name, use one of the following: ${Object.keys(
          meta
        ).join(', ')}.`
      );
    }
  }
  if (!meta[methodName] && !functions[methodName]) {
    throw new Error(
      `${operator}.${methodName} is not supported, use one of the following: ${Object.keys(
        meta
      ).join(', ')}.`
    );
  }
  // validate params type
  if (meta[methodName].validTypes && !meta[methodName].validTypes.includes(type.typeOf(params))) {
    throw new Error(
      `${operator}.${methodName} accepts one of the following types: ${meta[
        methodName
      ].validTypes.join(', ')}.`
    );
  }

  if (meta[methodName].noArgs) {
    try {
      return functions[methodName]();
    } catch (e) {
      throw new Error(`${operator}: - ${e.message}.`);
    }
  }
  let args = [];
  if (meta[methodName].singleArg || meta[methodName].property) {
    args = [params];
  } else {
    if (type.isArray(params)) {
      args = params;
    }
    if (type.isObject(params)) {
      args.push(...(meta[methodName].namedArgs || []).map((key) => params[key]));
      if (
        !type.isNone(meta[methodName].spreadArgs) &&
        !type.isArray(params[meta[methodName].spreadArgs])
      ) {
        throw new Error(
          `${operator}.${methodName} takes an array as input argument for ${meta[methodName].spreadArgs}.`
        );
      }
      args.push(...(params[meta[methodName].spreadArgs] || []));
    }
  }

  if (type.isFunction(meta[methodName].prep)) {
    args = meta[methodName].prep(args);
  }

  // for property
  if (meta[methodName].property) {
    return functions[methodName];
  }
  try {
    return functions[methodName](...args);
  } catch (e) {
    throw new Error(`${operator}.${methodName} - ${e.message}`);
  }
};

export default runClass;
