/* eslint-disable camelcase */

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

import { get, serializer, type } from '@lowdefy/helpers';

import {
  _and,
  _date,
  _dump_yaml,
  _eq,
  _if,
  _load_yaml,
  _mql_aggregate,
  _mql_expr,
  _mql_test,
  _not,
  _nunjucks,
  _operator,
  _or,
  _parse,
  _regex,
  _stringify,
  _type,
} from './operators';

function getFromObject(params, object, operator, location) {
  if (params === true) return object;
  if (type.isString(params)) {
    return get(object, params, { default: null });
  }
  if (type.isObject(params)) {
    if (params.all === true) return object;
    if (!type.isString(params.key)) {
      throw new Error(
        `Operator Error: ${operator}.key must be of type string. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    return get(object, params.key, { default: get(params, 'default', { default: null }) });
  }
  throw new Error(
    `Operator Error: ${operator} params must be of type string or object. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

function _args({ params, args, location }) {
  return getFromObject(params, args, '_args', location);
}

function _global({ params, lowdefyGlobal, location }) {
  return getFromObject(params, lowdefyGlobal, '_global', location);
}

function _input({ params, input, location }) {
  return getFromObject(params, input, '_input', location);
}

function _secret({ params, secrets, location }) {
  return getFromObject(params, secrets, '_secret', location);
}

function _state({ params, state, location }) {
  return getFromObject(params, state, '_state', location);
}

function _url_query({ params, urlQuery, location }) {
  return getFromObject(params, urlQuery, '_url_query', location);
}

function _get({ params, location }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _get takes an object as params. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  if (!type.isString(params.key)) {
    throw new Error(
      `Operator Error: _get.key takes a string. Received ${JSON.stringify(params)} at ${location}.`
    );
  }
  if (!type.isObject(params.from) && !type.isArray(params.from)) {
    return null;
  }
  return get(params.from, params.key, { default: get(params, 'default', { default: null }) });
}

class NodeParser {
  constructor({ config, input, lowdefyGlobal, secrets, state, urlQuery } = {}) {
    this.config = config;
    this.input = input;
    this.lowdefyGlobal = lowdefyGlobal;
    this.secrets = secrets;
    this.state = state;
    this.urlQuery = urlQuery;
    this.operations = {
      _and,
      _args,
      _date,
      _dump_yaml,
      _eq,
      _get,
      _global,
      _if,
      _input,
      _load_yaml,
      _mql_aggregate,
      _mql_expr,
      _mql_test,
      _not,
      _nunjucks,
      _operator,
      _or,
      _parse,
      _regex,
      _secret,
      _state,
      _stringify,
      _type,
      _url_query,
    };
    this.operationList = Object.keys(this.operations);
  }

  parse({ input, args, location }) {
    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isObject(args)) {
      throw new Error('Operator parser args must be a object.');
    }
    if (location && !type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
    }
    const errors = [];
    const reviver = (key, value) => {
      if (type.isObject(value)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const op of this.operationList) {
          try {
            if (!type.isUndefined(value[op])) {
              const res = this.operations[op]({
                args,
                config: this.config,
                input: this.input,
                location,
                lowdefyGlobal: this.lowdefyGlobal,
                mutations: this.mutations,
                operations: this.operations,
                params: value[op],
                secrets: this.secrets,
                state: this.state,
                urlQuery: this.urlQuery,
              });
              return res;
            }
          } catch (e) {
            errors.push(e);
            return null;
          }
        }
      }
      return value;
    };
    return {
      output: serializer.copy(input, { reviver }),
      errors,
    };
  }
}

export default NodeParser;
