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
import { type } from '@lowdefy/helpers';

import 'mingo/init/system';

function _mql_aggregate({ location, params }) {
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

export default _mql_aggregate;
