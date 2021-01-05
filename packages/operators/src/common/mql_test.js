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

function _mql_test({ location, params, state }) {
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

export default _mql_test;
