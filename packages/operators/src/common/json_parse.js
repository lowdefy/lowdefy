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

import { serializer, type } from '@lowdefy/helpers';

function _json_parse({ location, params }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _json_parse takes a string as input. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params === 'undefined') return undefined;
  try {
    return serializer.deserializeFromString(params);
  } catch (e) {
    throw new Error(
      `Operator Error: _json_parse - ${e.message} Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
}

export default _json_parse;
