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

import 'mingo/init/system';

function _mql_expr({ location, params, state }) {
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

export default _mql_expr;
