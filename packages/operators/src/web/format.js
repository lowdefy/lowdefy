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

import { type } from '@lowdefy/helpers';
import formatters from '@lowdefy/format';

function _format({ location, methodName, params }) {
  if (!formatters[methodName]) {
    throw new Error(
      `Operator Error: $_format.${methodName} is not supported, use one of the following: ${Object.keys(
        formatters
      ).join(', ')}.
      Received: {"_format.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _format takes an object as arguments. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (!type.isObject(params.params) && !type.isUndefined(params.params)) {
    throw new Error(
      `Operator Error: _format params argument should be an object or undefined. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return formatters[methodName](params.params)(params.on);
}

export default _format;
