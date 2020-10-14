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

import get from '@lowdefy/get';
import { applyArrayIndices } from '@lowdefy/helpers';
import serializer from '@lowdefy/serializer';
import type from '@lowdefy/type';

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

const contextKeys = {
  _action_log: 'actionLog',
  _state: 'state',
  _input: 'input',
  _request_details: 'requests',
  _mutation_details: 'mutations',
  _url_query: 'urlQuery',
};

function addListener({ context, targetContext }) {
  if (context.id === targetContext.id) {
    return;
  }
  targetContext.updateListeners.add(context.id);
}

function getFromOtherContext({ params, context, contexts, arrayIndices, operator, location }) {
  const { contextId } = params;
  if (!type.isString(contextId)) {
    throw new Error(
      `Operator Error: ${operator}.contextId must be of type string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  const targetContext = contexts[contextId];
  if (!type.isObject(targetContext)) {
    throw new Error(
      `Operator Error: Context ${contextId} not found. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  addListener({ context, targetContext });
  const object = targetContext[contextKeys[operator]];
  if (params.all === true) return object;
  if (type.isString(params.key)) {
    return get(object, applyArrayIndices(arrayIndices, params.key), {
      default: get(params, 'default', { default: null }),
    });
  }
  return object;
}

function getFromObject(params, object, arrayIndices, operator, location) {
  if (params === true) return object;
  if (type.isString(params)) {
    return get(object, applyArrayIndices(arrayIndices, params), { default: null });
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
    return get(object, applyArrayIndices(arrayIndices, params.key), {
      default: get(params, 'default', { default: null }),
    });
  }
  throw new Error(
    `Operator Error: ${operator} params must be of type string or object. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

function _args({ args, arrayIndices, location, params }) {
  return getFromObject(params, args, arrayIndices, '_args', location);
}

function _global({ arrayIndices, location, lowdefyGlobal, params }) {
  return getFromObject(params, lowdefyGlobal, arrayIndices, '_global', location);
}

function _input({ arrayIndices, context, contexts, input, location, params }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      params,
      context,
      contexts,
      arrayIndices,
      operator: '_input',
      location,
    });
  }
  return getFromObject(params, input, arrayIndices, '_input', location);
}

function _request_details({ arrayIndices, context, contexts, location, params, requests }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      arrayIndices,
      context,
      contexts,
      location,
      operator: '_request_details',
      params,
    });
  }
  return getFromObject(params, requests, arrayIndices, '_request_details', location);
}

function _mutation_details({ arrayIndices, context, contexts, location, mutations, params }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      arrayIndices,
      context,
      contexts,
      location,
      operator: '_mutation_details',
      params,
    });
  }
  return getFromObject(params, mutations, arrayIndices, '_mutation_details', location);
}

function _state({ params, state, context, contexts, arrayIndices, location }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      arrayIndices,
      context,
      contexts,
      location,
      operator: '_state',
      params,
    });
  }
  return getFromObject(params, state, arrayIndices, '_state', location);
}

function _url_query({ arrayIndices, context, contexts, location, params, urlQuery }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      params,
      context,
      contexts,
      arrayIndices,
      operator: '_url_query',
      location,
    });
  }
  return getFromObject(params, urlQuery, arrayIndices, '_url_query', location);
}

function _action_log({ params, actionLog, context, contexts, arrayIndices, location }) {
  if (params && params.contextId) {
    return getFromOtherContext({
      arrayIndices,
      context,
      contexts,
      location,
      operator: '_action_log',
      params,
    });
  }
  return getFromObject(params, actionLog, arrayIndices, '_action_log', location);
}

function getFromArray(params, array, key, operator, location) {
  if (params === true) return array;
  if (type.isString(params)) {
    return array.find((item) => item[key] === params);
  }
  if (type.isNumber(params)) {
    return array[params];
  }
  if (type.isObject(params)) {
    if (params.all === true) return array;
    if (type.isString(params.value)) return array.find((item) => item[key] === params.value);
    if (type.isNumber(params.index)) return array[params.index];
    if (!type.isNone(params.value) && !type.isString(params.value)) {
      throw new Error(
        `Operator Error: ${operator}.value must be of type string. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    if (!type.isNone(params.index) && !type.isNumber(params.index)) {
      throw new Error(
        `Operator Error: ${operator}.index must be of type number. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
  }
  throw new Error(
    `Operator Error: ${operator} must be of type string, number or object. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

function _menu({ params, menus, location }) {
  return getFromArray(params, menus, 'menuId', '_menu', location);
}

function _request({ params, requests, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _request accepts a string value. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params in requests && !requests[params].loading) {
    return requests[params].response;
  }
  return null; // return null for all requests which has not been filled on init
}

function _mutation({ params, mutations, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _mutation accepts a string value. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params in mutations && !mutations[params].loading) {
    return mutations[params].response;
  }
  return null; // return null for all requests which has not been filled on init
}

function _get({ params, arrayIndices, location }) {
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
  return get(params.from, applyArrayIndices(arrayIndices, params.key), {
    default: get(params, 'default', { default: null }),
  });
}

function _list_contexts({ contexts }) {
  return Object.keys(contexts).sort();
}

class WebParser {
  constructor({ context, contexts }) {
    this.context = context;
    this.contexts = contexts;
    this.operations = {
      _action_log,
      _and,
      _args,
      _date,
      _dump_yaml,
      _eq,
      _get,
      _global,
      _if,
      _input,
      _list_contexts,
      _load_yaml,
      _menu,
      _mql_aggregate,
      _mql_expr,
      _mql_test,
      _mutation,
      _mutation_details,
      _not,
      _nunjucks,
      _operator,
      _or,
      _parse,
      _request,
      _request_details,
      _regex,
      _state,
      _stringify,
      _type,
      _url_query,
    };
    this.operationList = Object.keys(this.operations);
  }

  parse({ input, args, location, arrayIndices }) {
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
                actionLog: this.context.actionLog,
                args,
                arrayIndices,
                config: this.context.config,
                context: this.context,
                contexts: this.contexts,
                input: this.context.input,
                location: location ? applyArrayIndices(arrayIndices, location) : null,
                lowdefyGlobal: this.context.lowdefyGlobal,
                menus: this.context.menus,
                mutations: this.context.mutations,
                operations: this.operations,
                requests: this.context.requests,
                params: value[op],
                state: this.context.state,
                urlQuery: this.context.urlQuery,
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

export default WebParser;
