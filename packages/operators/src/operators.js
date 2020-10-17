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
import serializer from '@lowdefy/serializer';
import type from '@lowdefy/type';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import YAML from 'js-yaml';
import mingo from 'mingo';
import { useOperators as mingoUseOperators, OperatorType as MingoOperatorType } from 'mingo/core';
import * as mingoAccumulatorOperators from 'mingo/operators/accumulator';
import * as mingoExpressionOperators from 'mingo/operators/expression';
import * as mingoPipelineOperators from 'mingo/operators/pipeline';
import * as mingoQueryOperators from 'mingo/operators/query';
import * as mingoProjectionOperators from 'mingo/operators/projection';

mingoUseOperators(MingoOperatorType.ACCUMULATOR, mingoAccumulatorOperators);
mingoUseOperators(MingoOperatorType.EXPRESSION, mingoExpressionOperators);
mingoUseOperators(MingoOperatorType.PIPELINE, mingoPipelineOperators);
mingoUseOperators(MingoOperatorType.PROJECTION, mingoQueryOperators);
mingoUseOperators(MingoOperatorType.QUERY, mingoProjectionOperators);

function _date({ params, location }) {
  if (type.isInt(params)) {
    return new Date(params);
  }
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _date input must be of type string or integer. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params === 'now') {
    return new Date();
  }
  const result = new Date(params);
  if (!type.isDate(result)) {
    throw new Error(
      `Operator Error: _date could not resolve as a valid javascript date. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return result;
}

function _mql_test({ params, state, location }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _mql_test takes an object with a MQL expression. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  try {
    if (type.isObject(params.test) && type.isObject(params.on)) {
      const query = new mingo.Query(params.test);
      return query.test(params.on);
    }
    const query = new mingo.Query(params);
    return query.test(state);
  } catch (e) {
    // log e to LowdefyError
    throw new Error(
      `Operator Error: _mql_test failed to execute MQL aggregation. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _mql_aggregate({ params, location }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _mql_aggregate takes an object with a MQL expression. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  let on;
  // if on is object (eg. state), make single object array to aggregate over
  if (type.isObject(params.on)) {
    on = [params.on];
  } else if (type.isArray(params.on)) {
    on = params.on;
  } else {
    throw new Error(
      `Operator Error: _mql_aggregate.on must be of type array or object. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (!type.isArray(params.pipeline)) {
    throw new Error(
      `Operator Error: _mql_aggregate.pipeline must be of type array. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  try {
    const agg = new mingo.Aggregator(params.pipeline);
    return agg.run(on);
  } catch (e) {
    // log e to LowdefyError
    throw new Error(
      `Operator Error: _mql_aggregate failed to execute MQL aggregation. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _mql_expr({ params, state, location }) {
  let on;
  let pipeline;
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _mql_expr takes an object with a MQL expression. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (type.isObject(params.expr) && type.isObject(params.on)) {
    pipeline = [
      {
        $project: {
          value: params.expr,
        },
      },
    ];
    on = [params.on];
  } else {
    pipeline = [
      {
        $project: {
          value: params,
        },
      },
    ];
    on = [state];
  }
  try {
    const agg = new mingo.Aggregator(pipeline);
    const res = agg.run(on);
    return get(res, '0.value', { default: null });
  } catch (e) {
    // log e to LowdefyError
    throw new Error(
      `Operator Error: _mql_expr failed to execute MQL expression. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _nunjucks({ params, state, location }) {
  let templateString;
  let on;
  if (type.isObject(params) && type.isString(params.template)) {
    templateString = params.template;
    on = type.isObject(params.on) ? params.on : {};
  }
  if (type.isString(params)) {
    templateString = params;
    on = state;
  }
  if (templateString) {
    try {
      const template = nunjucksFunction(templateString);
      return template(on);
    } catch (e) {
      // log e to LowdefyError
      throw new Error(
        `Operator Error: _nunjucks failed to parse nunjucks template. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
  }
  return null;
}

function _regex({ params, state, location }) {
  const pattern = type.isObject(params) ? params.pattern : params;
  if (!type.isString(pattern)) {
    throw new Error(
      `Operator Error: _regex.pattern must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  const on = !type.isUndefined(params.on)
    ? params.on
    : get(state, get(params, 'key', { default: location }));

  if (type.isNull(on)) {
    return false;
  }
  if (!type.isString(on)) {
    throw new Error(
      `Operator Error: _regex.on must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  try {
    const re = new RegExp(pattern, params.flags || 'gm');
    return re.test(on);
  } catch (e) {
    // log e to LowdefyError
    throw new Error(
      `Operator Error: _regex failed to execute RegExp.test. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _type({ params, state, location }) {
  const typeName = type.isObject(params) ? params.type : params;
  if (!type.isString(typeName)) {
    throw new Error(
      `Operator Error: _type.type must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  const on = Object.prototype.hasOwnProperty.call(params, 'on')
    ? params.on
    : get(state, get(params, 'key', { default: location }));

  switch (typeName) {
    case 'string':
      return type.isString(on);
    case 'array':
      return type.isArray(on);
    case 'date':
      return type.isDate(on); // Testing for date is problematic due to stringify
    case 'object':
      return type.isObject(on);
    case 'boolean':
      return type.isBoolean(on);
    case 'number':
      return type.isNumber(on);
    case 'integer':
      return type.isInt(on);
    case 'null':
      return type.isNull(on);
    case 'undefined':
      return type.isUndefined(on);
    case 'none':
      return type.isNone(on);
    case 'primitive':
      return type.isPrimitive(on);
    default:
      throw new Error(
        `Operator Error: "${typeName}" is not a valid _type test. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
  }
}

function _not({ params }) {
  return !params;
}

function _and({ params, location }) {
  if (!type.isArray(params)) {
    throw new Error(
      `Operator Error: _and takes an array type. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return !!params.reduce((acc, el) => acc && el, true);
}

function _or({ params, location }) {
  if (!type.isArray(params)) {
    throw new Error(
      `Operator Error: _or takes an array type. Received: ${JSON.stringify(params)} at ${location}.`
    );
  }
  return !!params.reduce((acc, el) => acc || el, false);
}

function _if({ params, location }) {
  if (params.test === true) {
    return params.then;
  }
  if (params.test === false) {
    return params.else;
  }
  throw new Error(
    `Operator Error: _if takes a boolean type for parameter test. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

function _eq({ params, location }) {
  if (!type.isArray(params)) {
    throw new Error(
      `Operator Error: _eq takes an array type as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.length !== 2) {
    throw new Error(
      `Operator Error: _eq takes an array of length 2 as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return params[0] === params[1];
}

function _stringify({ params }) {
  return serializer.serializeToString(params, { space: 2, isoStringDates: true });
}

function _parse({ params, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _parse takes a string as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params === 'undefined') return undefined;
  try {
    return serializer.deserializeFromString(params);
  } catch (e) {
    throw new Error(
      `Operator Error: _parse - ${e.message} Received: ${JSON.stringify(params)} at ${location}.`
    );
  }
}

function _load_yaml({ params, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _load_yaml takes a string as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params === 'undefined') return undefined;
  try {
    const loaded = YAML.safeLoad(params);
    return serializer.deserialize(loaded);
  } catch (e) {
    throw new Error(
      `Operator Error: _load_yaml - ${e.message} Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

function _dump_yaml({ params }) {
  return YAML.safeDump(serializer.serialize(params, { isoStringDates: true }), {
    sortKeys: true,
    noRefs: true,
  });
}

function _operator(options) {
  const { operations, params, location } = options;
  if (!type.isString(params.name)) {
    throw new Error(
      `Operator Error: _operator.name must be a valid operator name as string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.name === '_operator') {
    throw new Error(
      `Operator Error: _operator.name cannot be set to _operator to infinite avoid loop reference. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (Object.prototype.hasOwnProperty.call(operations, params.name)) {
    return operations[params.name]({ ...options, location, params: params && params.params });
  }
  throw new Error(
    `Operator Error: _operator - Invalid operator name. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

export {
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
};
