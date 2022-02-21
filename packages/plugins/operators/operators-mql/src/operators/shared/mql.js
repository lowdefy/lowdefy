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

import mingo from 'mingo';
import { get, type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

// TODO: fix build to work with:
// import 'mingo/init/system';

import { useOperators, OperatorType } from 'mingo/core.js';
import * as accumulatorOperators from 'mingo/operators/accumulator/index.js';
import * as expressionOperators from 'mingo/operators/expression/index.js';
import * as pipelineOperators from 'mingo/operators/pipeline/index.js';
import * as queryOperators from 'mingo/operators/query/index.js';
import * as projectionOperators from 'mingo/operators/projection/index.js';

// "import * as" is returning different object structures when the connection is being
// imported in the build or when running the tests.
// So we check for the a default object with all the named exports, otherwise the
// returned object has all the named exports.
useOperators(OperatorType.ACCUMULATOR, accumulatorOperators.default || accumulatorOperators);
useOperators(OperatorType.EXPRESSION, expressionOperators.default || expressionOperators);
useOperators(OperatorType.PIPELINE, pipelineOperators.default || pipelineOperators);
useOperators(OperatorType.QUERY, queryOperators.default || queryOperators);
useOperators(OperatorType.PROJECTION, projectionOperators.default || projectionOperators);

function aggregate(data, pipeline) {
  if (data === null) {
    data = [];
  }
  if (!type.isArray(data)) {
    throw new Error('Data must be of type array.');
  }
  if (!type.isArray(pipeline)) {
    throw new Error('Pipeline must be of type array.');
  }
  const agg = new mingo.Aggregator(pipeline);
  return agg.run(data);
}

function expr(data, expr) {
  if (data === null) {
    data = {};
  }
  if (!type.isObject(data)) {
    throw new Error('Data must be of type object.');
  }
  const agg = new mingo.Aggregator([
    {
      $project: {
        value: expr,
      },
    },
  ]);
  const res = agg.run([data]);
  return get(res, '0.value', { default: null });
}

function test(data, test) {
  if (data === null) {
    data = {};
  }
  if (!type.isObject(data)) {
    throw new Error('Data must be of type object.');
  }
  if (!type.isObject(test)) {
    throw new Error('Query test must be of type object.');
  }
  const query = new mingo.Query(test);
  return query.test(data);
}

const meta = {
  aggregate: { namedArgs: ['on', 'pipeline'], validTypes: ['array', 'object'] },
  expr: { namedArgs: ['on', 'expr'], validTypes: ['array', 'object'] },
  test: { namedArgs: ['on', 'test'], validTypes: ['array', 'object'] },
};

const functions = { aggregate, expr, test };

function mql({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_mql',
    params,
  });
}

export default mql;
