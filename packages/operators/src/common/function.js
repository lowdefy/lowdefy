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

import { serializer, type } from '@lowdefy/helpers';

function removeUnderscore(_, value) {
  if (type.isObject(value) && Object.keys(value).length === 1) {
    const key = Object.keys(value)[0];
    if (key.startsWith('__')) {
      const newKey = key.substring(1);
      return { [newKey]: value[key] };
    }
  }
  return value;
}

function _function({ arrayIndices, event, location, params, parser }) {
  const preparedParams = serializer.copy(params, { reviver: removeUnderscore });
  return (...args) => {
    const { output, errors } = parser.parse({
      arrayIndices,
      args,
      event,
      input: preparedParams,
      location,
    });
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
    return output;
  };
}

export default _function;
