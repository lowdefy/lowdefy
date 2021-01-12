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

import mingo from 'mingo';
import { get, type } from '@lowdefy/helpers';
import useMethod from '../useMethod';

import 'mingo/init/system';

function aggregate(data, pipeline) {
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
  if (!type.isObject(data)) {
    throw new Error('Data must be of type object.');
  }
  if (!type.isObject(test)) {
    throw new Error('Query test must be of type object.');
  }
  const query = new mingo.Query(test);
  return query.test(data);
}

const methods = {
  aggregate: { named: ['on', 'pipeline'], fn: aggregate },
  expr: { named: ['on', 'expr'], fn: expr },
  test: { named: ['on', 'test'], fn: test },
};

function mql({ params, location, methodName }) {
  if (type.isNone(methodName) || type.isUndefined(methods[methodName])) {
    throw new Error(
      `Operator Error: _mql must be used with one of the following methods:${Object.keys(
        methods
      ).map((key) => ` _mql.${key}`)}. Received: {"_mql":${JSON.stringify(params)}} at ${location}.`
    );
  }

  return useMethod({
    location,
    meta: methods[methodName],
    methodName,
    operator: '_mql',
    params,
  });
}

export default mql;
