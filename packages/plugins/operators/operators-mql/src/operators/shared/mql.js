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

import mingo from 'mingo';
import { get, type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

import 'mingo/init/system';

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

function expr(data, expression) {
  if (data === null) {
    data = {};
  }
  if (!type.isObject(data)) {
    throw new Error('Data must be of type object.');
  }
  const agg = new mingo.Aggregator([
    {
      $project: {
        value: expression,
      },
    },
  ]);
  const res = agg.run([data]);
  return get(res, '0.value', { default: null });
}

function test(data, testQuery) {
  if (data === null) {
    data = {};
  }
  if (!type.isObject(data)) {
    throw new Error('Data must be of type object.');
  }
  if (!type.isObject(testQuery)) {
    throw new Error('Query test must be of type object.');
  }
  const query = new mingo.Query(testQuery);
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
